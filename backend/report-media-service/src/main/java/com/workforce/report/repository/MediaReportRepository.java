package com.workforce.report.repository;

import com.workforce.report.model.MediaReport;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MediaReportRepository extends MongoRepository<MediaReport, String> {
    List<MediaReport> findByEmployeeIdOrderByUploadedAtDesc(Long employeeId);
    List<MediaReport> findByOrderIdOrderByUploadedAtDesc(Long orderId);
}
