package com.medibots.controller;

import com.medibots.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/department-analytics")
public class DepartmentAnalyticsController {
    private final DepartmentRepository deptRepo;
    private final ServiceCatalogRepository catalogRepo;
    private final OperationRepository opRepo;
    private final OperationTheatreRepository theatreRepo;
    private final LabTestBookingRepository labBookingRepo;
    private final ProfileRepository profileRepo;

    public DepartmentAnalyticsController(DepartmentRepository deptRepo, ServiceCatalogRepository catalogRepo,
                                         OperationRepository opRepo, OperationTheatreRepository theatreRepo,
                                         LabTestBookingRepository labBookingRepo, ProfileRepository profileRepo) {
        this.deptRepo = deptRepo;
        this.catalogRepo = catalogRepo;
        this.opRepo = opRepo;
        this.theatreRepo = theatreRepo;
        this.labBookingRepo = labBookingRepo;
        this.profileRepo = profileRepo;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> analytics(Authentication auth, @RequestParam(required = false) String hospitalId) {
        String hid = hospitalId;
        if (hid == null || hid.isBlank() && auth != null)
            hid = profileRepo.findByUserId(auth.getName()).map(p -> p.getHospitalId()).orElse(null);
        List<Map<String, Object>> byDepartment = new ArrayList<>();
        var depts = hid != null ? deptRepo.findByHospitalIdOrderByName(hid) : deptRepo.findAll();
        var services = hid != null ? catalogRepo.findByHospitalIdOrderByName(hid) : catalogRepo.findAll();
        var theatres = hid != null ? theatreRepo.findByHospitalIdOrderByName(hid) : theatreRepo.findAll();
        var ops = hid != null ? opRepo.findByHospitalIdOrderByScheduledAtDesc(hid) : opRepo.findAll();
        var labBookings = hid != null ? labBookingRepo.findByHospitalIdOrderByScheduledDateDesc(hid) : labBookingRepo.findAll();
        Map<String, Long> servicesByDept = services.stream()
                .filter(s -> s.getDepartmentId() != null && !s.getDepartmentId().isBlank())
                .collect(Collectors.groupingBy(s -> s.getDepartmentId(), Collectors.counting()));
        Map<String, Long> opsByTheatre = ops.stream()
                .filter(o -> o.getOperationTheatreId() != null && !o.getOperationTheatreId().isBlank())
                .collect(Collectors.groupingBy(o -> o.getOperationTheatreId(), Collectors.counting()));
        Map<String, String> theatreToDept = theatres.stream()
                .filter(t -> t.getDepartmentId() != null)
                .collect(Collectors.toMap(t -> t.getId(), t -> t.getDepartmentId(), (a, b) -> a));
        Map<String, Long> opsByDept = new HashMap<>();
        opsByTheatre.forEach((theatreId, count) -> {
            String deptId = theatreToDept.get(theatreId);
            if (deptId != null) opsByDept.merge(deptId, count, Long::sum);
        });
        for (var d : depts) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", d.getId());
            m.put("name", d.getName());
            m.put("description", d.getDescription());
            m.put("service_count", servicesByDept.getOrDefault(d.getId(), 0L).intValue());
            m.put("operation_count", opsByDept.getOrDefault(d.getId(), 0L).intValue());
            m.put("theatre_count", theatres.stream().filter(t -> d.getId().equals(t.getDepartmentId())).count());
            byDepartment.add(m);
        }
        Map<String, Object> summary = new HashMap<>();
        summary.put("total_departments", depts.size());
        summary.put("total_services", services.size());
        summary.put("total_operations", ops.size());
        summary.put("total_lab_bookings", labBookings.size());
        Map<String, Object> out = new HashMap<>();
        out.put("by_department", byDepartment);
        out.put("summary", summary);
        return ResponseEntity.ok(out);
    }
}
