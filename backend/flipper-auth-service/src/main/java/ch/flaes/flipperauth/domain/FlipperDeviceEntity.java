package ch.flaes.flipperauth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "flipper_device")
public class FlipperDeviceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String flipperId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String secret;

    public FlipperDeviceEntity() {
    }

    public FlipperDeviceEntity(String flipperId, UserEntity user, String secret) {
        this.flipperId = flipperId;
        this.user = user;
        this.secret = secret;
    }

    public Long getId() {
        return id;
    }

    public String getFlipperId() {
        return flipperId;
    }

    public void setFlipperId(String flipperId) {
        this.flipperId = flipperId;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }
}
