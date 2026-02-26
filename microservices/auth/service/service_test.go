package service_test

import (
	"iLeon/microservices/auth/models"
	"iLeon/microservices/auth/service"
	"testing"
)

// ── Manual mock for AuthRepository ──────────────────────────────────────────

type mockAuthRepo struct {
	loginFn    func(body models.LoginUserBody) *models.CustomeResponse
	registerFn func(body models.CreateUserBody) *models.CustomeResponse
}

func (m *mockAuthRepo) Login(body models.LoginUserBody) *models.CustomeResponse {
	return m.loginFn(body)
}

func (m *mockAuthRepo) Register(body models.CreateUserBody) *models.CustomeResponse {
	return m.registerFn(body)
}

// ── Helper ───────────────────────────────────────────────────────────────────

func newService(login func(models.LoginUserBody) *models.CustomeResponse,
	register func(models.CreateUserBody) *models.CustomeResponse) service.AuthService {
	return service.NewService(&mockAuthRepo{loginFn: login, registerFn: register})
}

// ── LoginUser tests ──────────────────────────────────────────────────────────

func TestLoginUser_Success(t *testing.T) {
	expectedToken := "jwt.token.string"
	svc := newService(
		func(_ models.LoginUserBody) *models.CustomeResponse {
			return &models.CustomeResponse{Msg: expectedToken, Context: true}
		},
		nil,
	)

	result := svc.LoginUser(models.LoginUserBody{Email: "user@test.com", Password: "pass"})

	if !result.Context {
		t.Errorf("expected Context=true, got false")
	}
	if result.Msg != expectedToken {
		t.Errorf("expected Msg=%q, got %q", expectedToken, result.Msg)
	}
}

func TestLoginUser_InvalidEmail(t *testing.T) {
	svc := newService(
		func(_ models.LoginUserBody) *models.CustomeResponse {
			return &models.CustomeResponse{Msg: "Invalid user email or password", Context: false}
		},
		nil,
	)

	result := svc.LoginUser(models.LoginUserBody{Email: "nobody@test.com", Password: "pass"})

	if result.Context {
		t.Errorf("expected Context=false for unknown email")
	}
	if result.Msg != "Invalid user email or password" {
		t.Errorf("unexpected message: %q", result.Msg)
	}
}

func TestLoginUser_WrongPassword(t *testing.T) {
	svc := newService(
		func(_ models.LoginUserBody) *models.CustomeResponse {
			return &models.CustomeResponse{Msg: "Invalid password", Context: false}
		},
		nil,
	)

	result := svc.LoginUser(models.LoginUserBody{Email: "user@test.com", Password: "wrong"})

	if result.Context {
		t.Errorf("expected Context=false for wrong password")
	}
	if result.Msg != "Invalid password" {
		t.Errorf("unexpected message: %q", result.Msg)
	}
}

func TestLoginUser_DelegatesBodyToRepository(t *testing.T) {
	captured := models.LoginUserBody{}
	svc := newService(
		func(body models.LoginUserBody) *models.CustomeResponse {
			captured = body
			return &models.CustomeResponse{Msg: "token", Context: true}
		},
		nil,
	)

	payload := models.LoginUserBody{Email: "a@b.com", Password: "secret"}
	svc.LoginUser(payload)

	if captured.Email != payload.Email || captured.Password != payload.Password {
		t.Errorf("repository received wrong payload: got %+v, want %+v", captured, payload)
	}
}

// ── RegisterUser tests ───────────────────────────────────────────────────────

func TestRegisterUser_Success(t *testing.T) {
	svc := newService(
		nil,
		func(_ models.CreateUserBody) *models.CustomeResponse {
			return &models.CustomeResponse{Msg: "Created the new user", Context: true}
		},
	)

	result := svc.RegisterUser(models.CreateUserBody{
		Username: "alice",
		Email:    "alice@test.com",
		Password: "securepass",
	})

	if !result.Context {
		t.Errorf("expected Context=true for new user")
	}
	if result.Msg != "Created the new user" {
		t.Errorf("unexpected message: %q", result.Msg)
	}
}

func TestRegisterUser_DuplicateEmail(t *testing.T) {
	svc := newService(
		nil,
		func(_ models.CreateUserBody) *models.CustomeResponse {
			return &models.CustomeResponse{
				Msg:     "This user with the current email already exists!",
				Context: false,
			}
		},
	)

	result := svc.RegisterUser(models.CreateUserBody{
		Username: "alice2",
		Email:    "alice@test.com",
		Password: "pass",
	})

	if result.Context {
		t.Errorf("expected Context=false for duplicate email")
	}
}

func TestRegisterUser_DelegatesBodyToRepository(t *testing.T) {
	var captured models.CreateUserBody
	svc := newService(
		nil,
		func(body models.CreateUserBody) *models.CustomeResponse {
			captured = body
			return &models.CustomeResponse{Msg: "ok", Context: true}
		},
	)

	payload := models.CreateUserBody{Username: "bob", Email: "bob@test.com", Password: "pw"}
	svc.RegisterUser(payload)

	if captured.Username != payload.Username || captured.Email != payload.Email {
		t.Errorf("repository received wrong payload: got %+v, want %+v", captured, payload)
	}
}
