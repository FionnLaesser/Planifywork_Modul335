package com.workforce.report.service;

import com.workforce.report.dto.MediaReportResponse;
import com.workforce.report.exception.ResourceNotFoundException;
import com.workforce.report.model.MediaReport;
import com.workforce.report.repository.MediaReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaReportService {

    private final MediaReportRepository repository;

    public MediaReportResponse upload(MultipartFile file, Long employeeId, Long orderId, String note) throws IOException {
        if (employeeId == null || employeeId <= 0) {
            throw new IllegalArgumentException("employeeId ist erforderlich");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Datei ist erforderlich");
        }
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        if (!contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Nur Bilddateien sind erlaubt");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Bild ist zu gross. Maximal 10 MB erlaubt");
        }

        String id = UUID.randomUUID().toString();
        String originalName = file.getOriginalFilename() == null ? "rapport.jpg" : file.getOriginalFilename();

        MediaReport report = new MediaReport();
        report.setId(id);
        report.setEmployeeId(employeeId);
        report.setOrderId(orderId);
        report.setRapportId(UUID.randomUUID().toString());
        report.setFilename(originalName);
        report.setContentType(contentType);
        report.setFileSize((int) file.getSize());
        report.setStoragePath("mongodb://workforce-media/media_reports/" + id);
        report.setUploadedAt(Instant.now());
        Map<String, Object> metadata = note == null || note.isBlank()
                ? Map.of()
                : Map.of("note", note.trim());
        report.setMetadata(metadata);
        report.setData(file.getBytes());

        return MediaReportResponse.from(repository.save(report));
    }

    public MediaReport getFile(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bild/Rapport mit ID " + id + " nicht gefunden"));
    }

    public List<MediaReportResponse> listByOrder(Long orderId) {
        return repository.findByOrderIdOrderByUploadedAtDesc(orderId).stream()
                .map(MediaReportResponse::from)
                .toList();
    }

    public List<MediaReportResponse> listByEmployee(Long employeeId) {
        return repository.findByEmployeeIdOrderByUploadedAtDesc(employeeId).stream()
                .map(MediaReportResponse::from)
                .toList();
    }
}
