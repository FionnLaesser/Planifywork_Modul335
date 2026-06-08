package com.workforce.report.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.Map;

@Document(collection = "media_reports")
@Getter
@Setter
public class MediaReport {

    @Id
    private String id;

    @Field("employee_id")
    private Long employeeId;

    @Field("order_id")
    private Long orderId;

    @Field("rapport_id")
    private String rapportId;

    @Field("filename")
    private String filename;

    @Field("content_type")
    private String contentType;

    @Field("file_size")
    private Integer fileSize;

    @Field("storage_path")
    private String storagePath;

    @Field("uploaded_at")
    private Instant uploadedAt;

    @Field("metadata")
    private Map<String, Object> metadata;

    @Field("data")
    private byte[] data;
}
