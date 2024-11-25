package service

import (
	"iLeon/microservices/auth/models"
	"iLeon/microservices/auth/repository"
)

type AuthService interface {
	LoginUser(body models.LoginUserBody) *models.CustomeResponse
	RegisterUser(models.CreateUserBody) *models.CustomeResponse
}

type Service struct {
	repository repository.AuthRepository
}

func NewService(r repository.AuthRepository) AuthService {
	return &Service{
		repository: r,
	}
}

func (s *Service) LoginUser(body models.LoginUserBody) *models.CustomeResponse {
	return s.repository.Login(body)
}

func (s *Service) RegisterUser(body models.CreateUserBody) *models.CustomeResponse {
	return s.repository.Register(body)
}
