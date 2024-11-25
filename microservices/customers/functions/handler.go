package functions

import (
	"iLeon/microservices/controller"
	"iLeon/microservices/service"

	"github.com/nats-io/nats.go"
)

func Handler(n *nats.Conn, service service.CustomerService) {

	controller.GetAllCustomers(n, service)
	controller.GetCustomer(n, service)
	controller.CreateCustomer(n, service)
	controller.UpdateCustomer(n, service)
	controller.DeleteCustomer()

}
