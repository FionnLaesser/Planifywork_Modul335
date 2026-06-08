package com.workforce.report.dto;

import com.workforce.report.model.MediaReport;

import java.time.Instant;
import java.util.Map;

public record MediaReportResponse(
        String id,
        Long employeeId,
        Long orderId,
        String rapportId,
        String filename,
        String contentType,
        Integer fileSize,
        String storagePath,
        Instant uploadedAt,
        Map<String, Object> metadata
) {
    public static MediaReportResponse from(MediaReport report) {
        return new MediaReportResponse(
                report.getId(),
                report.getEmployeeId(),
                report.getOrderId(),
                report.getRapportId(),
                report.getFilename(),
                report.getContentType(),
                report.getFileSize(),
                report.getStoragePath(),
                report.getUploadedAt(),
                report.getMetadata()
        );
    }
}
