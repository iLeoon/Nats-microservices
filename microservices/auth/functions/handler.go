package functions

import (
	"iLeon/microservices/auth/controller"
	"iLeon/microservices/auth/service"

	"github.com/nats-io/nats.go"
)

func Handler(n *nats.Conn, service service.AuthService) {
	controller.LoginUser(n, service)
	controller.RegisterUser(n, service)
}
