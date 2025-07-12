package org.example.backendproject.repository;

import org.example.backendproject.Entity.Client;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClientRepository extends CrudRepository<Client,Long> {
    @Query("SELECT c FROM Client c WHERE c.email =:email AND c.password=:password")
    public Optional<Client> searchByLogin(@Param("email") String email, @Param("password") String password);

    @Query("SELECT c FROM Client c WHERE c.email =:email")
    public Optional<Client> searchByEmail(@Param("email") String email);

    @Query("SELECT c FROM Client c WHERE c.id =:id ")
    public Optional<Client> findClientById(@Param("id") Long id);
}
