package org.example.backendproject.Entity;

import jakarta.persistence.*;
@Entity
public class Purchase {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    @ManyToOne
    @JoinColumn(name="client_Id")
    private Client client;
    private String address;
    private String phone;
    private String paymentMethod;
    private String notes;
    public Purchase() {}

    public Purchase(Long id, Client client, String address, String phone, String paymentMethod, String notes) {
        this.id = id;
        this.client = client;
        this.address = address;
        this.phone = phone;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
