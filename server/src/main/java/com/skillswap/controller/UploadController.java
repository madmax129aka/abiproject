package com.skillswap.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @PostMapping("/certificate")
    public ResponseEntity<?> uploadCertificate(@RequestParam("certificate") MultipartFile file) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No file uploaded"));

        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("application/pdf") || contentType.startsWith("image/")))
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only PDF and image files allowed"));

        if (file.getSize() > 5 * 1024 * 1024)
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File too large (max 5MB)"));

        try {
            String filename = "cert-" + UUID.randomUUID() + getExtension(file.getOriginalFilename());
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();
            File dest = new File(dir, filename);
            file.transferTo(dest);

            String url = "/uploads/certificates/" + filename;
            return ResponseEntity.ok(Map.of("success", true, "url", url, "filename", filename));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Upload failed"));
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
