package com.workforce.report.controller;

import com.workforce.report.dto.MediaReportResponse;
import com.workforce.report.model.MediaReport;
import com.workforce.report.service.MediaReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaReportService mediaReportService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHIFT_LEAD','HR','ADMIN')")
    public ResponseEntity<MediaReportResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam Long employeeId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) String note) throws IOException {
        return ResponseEntity.status(201).body(mediaReportService.upload(file, employeeId, orderId, note));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHIFT_LEAD','HR','ADMIN')")
    public ResponseEntity<byte[]> getImage(@PathVariable String id) {
        MediaReport report = mediaReportService.getFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(report.getContentType()))
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                .body(report.getData());
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('SHIFT_LEAD','HR','ADMIN')")
    public ResponseEntity<List<MediaReportResponse>> byOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(mediaReportService.listByOrder(orderId));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHIFT_LEAD','HR','ADMIN')")
    public ResponseEntity<List<MediaReportResponse>> byEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(mediaReportService.listByEmployee(employeeId));
    }
}
