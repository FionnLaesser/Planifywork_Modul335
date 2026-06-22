package com.workforce.billing.service;

import com.workforce.billing.dto.CreateInvoiceRequest;
import com.workforce.billing.dto.CreatePayrollStatementRequest;
import com.workforce.billing.dto.InvoiceResponse;
import com.workforce.billing.dto.PayrollStatementResponse;
import com.workforce.billing.exception.ResourceNotFoundException;
import com.workforce.billing.model.Invoice;
import com.workforce.billing.model.InvoicePosition;
import com.workforce.billing.model.InvoiceStatus;
import com.workforce.billing.model.PayrollStatement;
import com.workforce.billing.model.PayrollStatus;
import com.workforce.billing.repository.InvoiceRepository;
import com.workforce.billing.repository.PayrollStatementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;

/**
 * Service-Klasse für Rechnungen und Lohnauszüge.
 */
@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final PayrollStatementRepository payrollStatementRepository;
    private final JdbcTemplate jdbcTemplate;

    /** Gibt alle Rechnungen zurück, optional gefiltert nach Status. */
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAll(String status) {
        List<Invoice> invoices = status != null
                ? invoiceRepository.findByStatusOrderByCreatedAtDesc(InvoiceStatus.valueOf(status))
                : invoiceRepository.findAllByOrderByCreatedAtDesc();

        return invoices.stream().map(InvoiceResponse::from).toList();
    }

    /** Gibt eine einzelne Rechnung anhand ihrer ID zurück. */
    @Transactional(readOnly = true)
    public InvoiceResponse getById(Long id) {
        return InvoiceResponse.from(findOrThrow(id));
    }

    /** Erstellt eine neue Rechnung als Entwurf. */
    @Transactional
    public InvoiceResponse create(CreateInvoiceRequest request) {
        Invoice invoice = new Invoice();
        invoice.setOrderId(request.orderId());
        invoice.setCreatedBy(request.createdBy());

        List<InvoicePosition> positions = request.positions().stream().map(posReq -> {
            InvoicePosition pos = new InvoicePosition();
            pos.setDescription(posReq.description());
            pos.setHours(posReq.hours());
            pos.setRate(posReq.rate());
            pos.setSubtotal(posReq.hours().multiply(posReq.rate())
                    .setScale(2, RoundingMode.HALF_UP));
            pos.setInvoice(invoice);
            return pos;
        }).toList();

        invoice.setPositions(positions);

        BigDecimal totalHours = positions.stream()
                .map(InvoicePosition::getHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal amount = positions.stream()
                .map(InvoicePosition::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        invoice.setTotalHours(totalHours);
        invoice.setAmount(amount);

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    /** Setzt den Status einer Rechnung auf SENT. */
    @Transactional
    public InvoiceResponse send(Long id) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new IllegalStateException(
                    "Nur Entwürfe können versendet werden (aktueller Status: "
                    + invoice.getStatus() + ")");
        }
        invoice.setStatus(InvoiceStatus.SENT);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    /** Markiert eine Rechnung als bezahlt. */
    @Transactional
    public InvoiceResponse markPaid(Long id) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.SENT) {
            throw new IllegalStateException(
                    "Nur versendete Rechnungen können als bezahlt markiert werden");
        }
        invoice.setStatus(InvoiceStatus.PAID);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    /** Gibt alle Lohnauszüge zurück, optional gefiltert nach Status. */
    @Transactional(readOnly = true)
    public List<PayrollStatementResponse> getPayrollStatements(String status) {
        List<PayrollStatement> statements = status != null && !status.isBlank()
                ? payrollStatementRepository.findByStatusOrderByYearDescMonthDescEmployeeIdAsc(PayrollStatus.valueOf(status))
                : payrollStatementRepository.findAllByOrderByYearDescMonthDescEmployeeIdAsc();

        return statements.stream().map(PayrollStatementResponse::from).toList();
    }

    /** Gibt einen Lohnauszug anhand seiner ID zurück. */
    @Transactional(readOnly = true)
    public PayrollStatementResponse getPayrollStatement(Long id) {
        return PayrollStatementResponse.from(findPayrollOrThrow(id));
    }

    /** Erstellt oder aktualisiert einen monatlichen Lohnauszug anhand der gespeicherten Time Entries. */
    @Transactional
    public PayrollStatementResponse createPayrollStatement(CreatePayrollStatementRequest request) {
        validatePayrollRequest(request);
        YearMonth period = YearMonth.of(request.year(), request.month());
        BigDecimal totalHours = loadEmployeeHours(request.employeeId(), period);
        BigDecimal hourlyRate = normalizeMoney(request.hourlyRate());
        BigDecimal bonus = normalizeMoney(request.bonusAmount());
        BigDecimal deductions = normalizeMoney(request.deductionAmount());

        BigDecimal gross = totalHours.multiply(hourlyRate).setScale(2, RoundingMode.HALF_UP).add(bonus);
        BigDecimal net = gross.subtract(deductions).setScale(2, RoundingMode.HALF_UP);

        PayrollStatement statement = payrollStatementRepository
                .findByEmployeeIdAndYearAndMonth(request.employeeId(), request.year(), request.month())
                .orElseGet(PayrollStatement::new);

        if (statement.getStatus() == PayrollStatus.PAID) {
            throw new IllegalStateException("Bezahlte Lohnauszüge können nicht neu berechnet werden");
        }

        statement.setEmployeeId(request.employeeId());
        statement.setYear(request.year());
        statement.setMonth(request.month());
        statement.setHourlyRate(hourlyRate);
        statement.setTotalHours(totalHours);
        statement.setBonusAmount(bonus);
        statement.setDeductionAmount(deductions);
        statement.setGrossAmount(gross);
        statement.setNetAmount(net);
        statement.setCreatedBy(request.createdBy());
        statement.setStatus(PayrollStatus.DRAFT);

        return PayrollStatementResponse.from(payrollStatementRepository.save(statement));
    }

    /** Gibt einen Lohnauszug frei. */
    @Transactional
    public PayrollStatementResponse approvePayrollStatement(Long id) {
        PayrollStatement statement = findPayrollOrThrow(id);
        if (statement.getStatus() != PayrollStatus.DRAFT) {
            throw new IllegalStateException("Nur Lohnauszüge im Status DRAFT können freigegeben werden");
        }
        statement.setStatus(PayrollStatus.APPROVED);
        return PayrollStatementResponse.from(payrollStatementRepository.save(statement));
    }

    /** Markiert einen Lohnauszug als bezahlt. */
    @Transactional
    public PayrollStatementResponse payPayrollStatement(Long id) {
        PayrollStatement statement = findPayrollOrThrow(id);
        if (statement.getStatus() != PayrollStatus.APPROVED) {
            throw new IllegalStateException("Nur freigegebene Lohnauszüge können bezahlt werden");
        }
        statement.setStatus(PayrollStatus.PAID);
        return PayrollStatementResponse.from(payrollStatementRepository.save(statement));
    }

    private BigDecimal loadEmployeeHours(Long employeeId, YearMonth period) {
        BigDecimal sum = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(total_hours), 0) FROM time_entries " +
                        "WHERE employee_id = ? AND entry_date BETWEEN ? AND ?",
                BigDecimal.class,
                employeeId,
                period.atDay(1),
                period.atEndOfMonth()
        );
        return sum == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : sum.setScale(2, RoundingMode.HALF_UP);
    }

    private void validatePayrollRequest(CreatePayrollStatementRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request darf nicht leer sein");
        }
        if (request.employeeId() == null || request.employeeId() <= 0) {
            throw new IllegalArgumentException("employeeId ist erforderlich");
        }
        if (request.year() == null || request.year() < 2000) {
            throw new IllegalArgumentException("year ist erforderlich und muss gültig sein");
        }
        if (request.month() == null || request.month() < 1 || request.month() > 12) {
            throw new IllegalArgumentException("month muss zwischen 1 und 12 liegen");
        }
        if (request.hourlyRate() == null || request.hourlyRate().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("hourlyRate ist erforderlich und darf nicht negativ sein");
        }
        if (request.bonusAmount() != null && request.bonusAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("bonusAmount darf nicht negativ sein");
        }
        if (request.deductionAmount() != null && request.deductionAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("deductionAmount darf nicht negativ sein");
        }
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    /** Hilfsmethode: sucht eine Rechnung und wirft Exception wenn nicht gefunden. */
    private Invoice findOrThrow(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Rechnung mit ID " + id + " nicht gefunden"));
    }

    private PayrollStatement findPayrollOrThrow(Long id) {
        return payrollStatementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lohnauszug mit ID " + id + " nicht gefunden"));
    }
}
