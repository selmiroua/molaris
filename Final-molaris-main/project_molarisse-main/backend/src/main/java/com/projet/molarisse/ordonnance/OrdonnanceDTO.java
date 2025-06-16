package com.projet.molarisse.ordonnance;

public class OrdonnanceDTO {
    private Long id;
    private String doctorName;
    private String patientName;
    private String treatments;
    private String signature;
    private String date;
    private Long doctorId;
    private Long patientId;
    private Integer toothNumber;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getTreatments() { return treatments; }
    public void setTreatments(String treatments) { this.treatments = treatments; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Integer getToothNumber() { return toothNumber; }
    public void setToothNumber(Integer toothNumber) { this.toothNumber = toothNumber; }
} 