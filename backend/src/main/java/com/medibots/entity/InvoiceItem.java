package com.medibots.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "invoice_items")
public class InvoiceItem {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "invoice_id", nullable = false, length = 36)
    private String invoiceId;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description = "";
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;
    @Column(name = "item_type", nullable = false, length = 64)
    private String itemType = "CONSULTATION";
    @Column(name = "recommendation_id", length = 36)
    private String recommendationId;
    @Column(name = "service_catalog_id", length = 36)
    private String serviceCatalogId;
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }
    public String getRecommendationId() { return recommendationId; }
    public void setRecommendationId(String recommendationId) { this.recommendationId = recommendationId; }
    public String getServiceCatalogId() { return serviceCatalogId; }
    public void setServiceCatalogId(String serviceCatalogId) { this.serviceCatalogId = serviceCatalogId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
