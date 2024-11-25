package controller

import (
	"encoding/json"
	"fmt"
	"iLeon/microservices/models"
	"iLeon/microservices/service"

	"github.com/nats-io/nats.go"
)

// handle error messages

func GetAllCustomers(nc *nats.Conn, s service.CustomerService) {

	nc.Subscribe("findCustomers", func(msg *nats.Msg) {
		customers, err := s.FetchCustomers()

		if err != nil {
			fmt.Println("Something bad occured while trying to fetch customers")
		}

		data, _ := json.Marshal(customers)
		nc.Publish(msg.Reply, data)
	})

	nc.Flush()

}

func GetCustomer(nc *nats.Conn, s service.CustomerService) {

	nc.Subscribe("findCustomer", func(msg *nats.Msg) {
		var payload models.Payload
		err := json.Unmarshal(msg.Data, &payload)

		if err != nil {
			panic(err)
		}

		customer, err := s.FetchCustomer(payload.Data)

		if err != nil {
			panic(err)
		}

		data, _ := json.Marshal(customer)
		nc.Publish(msg.Reply, data)
	})

	nc.Flush()
}

func CreateCustomer(nc *nats.Conn, s service.CustomerService) {
	nc.Subscribe("createCustomer", func(msg *nats.Msg) {
		var payload models.CreateCustomerPayload
		err := json.Unmarshal(msg.Data, &payload)

		if err != nil {
			panic(err)
		}
		createdCustomer, err := s.InsertCustomer(payload.Data)

		if err != nil {
			panic(err)
		}

		data, _ := json.Marshal(&createdCustomer)
		nc.Publish(msg.Reply, data)
	})

}

func UpdateCustomer(nc *nats.Conn, s service.CustomerService) {
	nc.Subscribe("updateCustomer", func(msg *nats.Msg) {
		var payload models.UpdateCustomerPayload

		err := json.Unmarshal(msg.Data, &payload)

		if err != nil {
			panic(err)
		}

		updatedCustomer, err := s.ChangeCustomer(payload.Data.Customer, payload.Data.Id)

		if err != nil {
			panic(err)
		}
		data, _ := json.Marshal(&updatedCustomer)
		nc.Publish(msg.Reply, data)

	})
}

func DeleteCustomer() {}
