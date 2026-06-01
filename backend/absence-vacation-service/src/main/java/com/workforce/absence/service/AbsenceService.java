package com.workforce.absence.service;

import com.workforce.absence.dto.AbsenceResponse;
import com.workforce.absence.dto.CreateAbsenceRequest;
import com.workforce.absence.dto.ReviewRequest;
import com.workforce.absence.dto.UpdateAbsenceRequest;
import com.workforce.absence.exception.ResourceNotFoundException;
import com.workforce.absence.model.Absence;
import com.workforce.absence.model.AbsenceStatus;
import com.workforce.absence.model.AbsenceType;
import com.workforce.absence.repository.AbsenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service-Klasse für die Verwaltung von Abwesenheiten und Ferienanfragen.
 *
 * <p>Implementiert folgende User Stories:
 * <ul>
 *   <li>US-HR-08: Ferienanfragen genehmigen / ablehnen</li>
 *   <li>US-HR-09: Absenzen verwalten</li>
 *   <li>US-HR-10: Abwesenheitskalender (Daten bereitstellen)</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class AbsenceService {

    private final AbsenceRepository absenceRepository;

    /**
     * Gibt alle Abwesenheiten zurück, optional gefiltert nach Mitarbeiter und/oder Typ.
     * Implementiert US-HR-09 (Absenzen verwalten) und US-HR-10 (Kalender).
     *
     * @param employeeId Mitarbeiter-ID als Filter (optional)
     * @param type       Abwesenheitstyp als Filter (optional, z.B. "VACATION")
     * @return gefilterte Liste der Abwesenheiten
     */
    @Transactional(readOnly = true)
    public List<AbsenceResponse> getAll(Long employeeId, String type) {
        List<Absence> absences;

        if (employeeId != null && type != null) {
            absences = absenceRepository.findByEmployeeIdAndType(
                    employeeId, AbsenceType.valueOf(type));
        } else if (employeeId != null) {
            absences = absenceRepository.findByEmployeeId(employeeId);
        } else if (type != null) {
            absences = absenceRepository.findByType(AbsenceType.valueOf(type));
        } else {
            absences = absenceRepository.findAll();
        }

        return absences.stream().map(AbsenceResponse::from).toList();
    }

    /**
     * Gibt alle Abwesenheiten mit dem Status PENDING zurück.
     * Implementiert US-HR-08 (offene Ferienanfragen).
     *
     * @return Liste der pendenten Anfragen, sortiert nach Einreichdatum
     */
    @Transactional(readOnly = true)
    public List<AbsenceResponse> getPending() {
        return absenceRepository.findByStatusOrderByCreatedAtAsc(AbsenceStatus.PENDING)
                .stream()
                .map(AbsenceResponse::from)
                .toList();
    }

    /**
     * Gibt eine einzelne Abwesenheit anhand der ID zurück.
     *
     * @param id Abwesenheits-ID
     * @return {@link AbsenceResponse}
     * @throws ResourceNotFoundException wenn nicht gefunden
     */
    @Transactional(readOnly = true)
    public AbsenceResponse getById(Long id) {
        return AbsenceResponse.from(findOrThrow(id));
    }

    /**
     * Erstellt eine neue Abwesenheitsanfrage.
     * Implementiert US-HR-09 (manuelle Erfassung durch HR) sowie den Flutter-App-Flow.
     *
     * @param request DTO mit den Abwesenheitsdaten
     * @return neu erstellter {@link AbsenceResponse}
     * @throws IllegalArgumentException wenn das Enddatum vor dem Startdatum liegt
     *                                  oder ein ungültiger Typ angegeben wird
     */
    @Transactional
    public AbsenceResponse create(CreateAbsenceRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException(
                    "Enddatum darf nicht vor dem Startdatum liegen");
        }

        Absence absence = new Absence();
        absence.setEmployeeId(request.employeeId());
        absence.setType(AbsenceType.valueOf(request.type()));
        absence.setStartDate(request.startDate());
        absence.setEndDate(request.endDate());
        absence.setReason(request.reason());

        return AbsenceResponse.from(absenceRepository.save(absence));
    }

    /**
     * Aktualisiert Typ, Zeitraum und Begründung einer bestehenden Abwesenheit.
     * Implementiert US-HR-09 (Absenzen bearbeiten durch HR).
     *
     * @param id      ID der Abwesenheit
     * @param request DTO mit den neuen Werten
     * @return aktualisierter {@link AbsenceResponse}
     * @throws ResourceNotFoundException wenn nicht gefunden
     * @throws IllegalArgumentException  wenn Enddatum vor Startdatum liegt
     */
    @Transactional
    public AbsenceResponse update(Long id, UpdateAbsenceRequest request) {
        Absence absence = findOrThrow(id);

        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Enddatum darf nicht vor dem Startdatum liegen");
        }

        absence.setType(AbsenceType.valueOf(request.type()));
        absence.setStartDate(request.startDate());
        absence.setEndDate(request.endDate());
        absence.setReason(request.reason());

        return AbsenceResponse.from(absenceRepository.save(absence));
    }

    /**
     * Genehmigt eine Abwesenheitsanfrage.
     * Implementiert US-HR-08 (Ferienanfragen genehmigen).
     *
     * @param id      ID der Abwesenheitsanfrage
     * @param request DTO mit der ID der genehmigenden HR-Person
     * @return aktualisierter {@link AbsenceResponse} mit Status APPROVED
     * @throws ResourceNotFoundException wenn die Anfrage nicht existiert
     * @throws IllegalStateException     wenn die Anfrage nicht mehr PENDING ist
     */
    @Transactional
    public AbsenceResponse approve(Long id, ReviewRequest request) {
        Absence absence = findOrThrow(id);
        assertPending(absence);

        absence.setStatus(AbsenceStatus.APPROVED);
        absence.setReviewedBy(request.reviewerId());

        return AbsenceResponse.from(absenceRepository.save(absence));
    }

    /**
     * Lehnt eine Abwesenheitsanfrage ab.
     * Implementiert US-HR-08 (Ferienanfragen ablehnen).
     *
     * @param id      ID der Abwesenheitsanfrage
     * @param request DTO mit Reviewer-ID und optionaler Ablehnungsbegründung
     * @return aktualisierter {@link AbsenceResponse} mit Status REJECTED
     * @throws ResourceNotFoundException wenn die Anfrage nicht existiert
     * @throws IllegalStateException     wenn die Anfrage nicht mehr PENDING ist
     */
    @Transactional
    public AbsenceResponse reject(Long id, ReviewRequest request) {
        Absence absence = findOrThrow(id);
        assertPending(absence);

        absence.setStatus(AbsenceStatus.REJECTED);
        absence.setReviewedBy(request.reviewerId());
        absence.setRejectionReason(request.rejectionReason());

        return AbsenceResponse.from(absenceRepository.save(absence));
    }

    /**
     * Löscht eine Abwesenheit dauerhaft aus der Datenbank.
     * Implementiert US-HR-09 (Absenzen löschen).
     *
     * @param id ID der zu löschenden Abwesenheit
     * @throws ResourceNotFoundException wenn die Abwesenheit nicht existiert
     */
    @Transactional
    public void delete(Long id) {
        if (!absenceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Absenz mit ID " + id + " nicht gefunden");
        }
        absenceRepository.deleteById(id);
    }

    /**
     * Hilfsmethode: sucht eine Abwesenheit und wirft Exception wenn nicht gefunden.
     *
     * @param id Abwesenheits-ID
     * @return die gefundene {@link Absence}-Entity
     * @throws ResourceNotFoundException wenn nicht gefunden
     */
    private Absence findOrThrow(Long id) {
        return absenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Absenz mit ID " + id + " nicht gefunden"));
    }

    /**
     * Prüft ob eine Anfrage noch im Status PENDING ist.
     *
     * @param absence die zu prüfende Abwesenheit
     * @throws IllegalStateException wenn der Status nicht PENDING ist
     */
    private void assertPending(Absence absence) {
        if (absence.getStatus() != AbsenceStatus.PENDING) {
            throw new IllegalStateException(
                    "Anfrage wurde bereits bearbeitet (Status: " + absence.getStatus() + ")");
        }
    }
}
