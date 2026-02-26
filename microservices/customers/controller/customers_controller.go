package controller

import (
	"encoding/json"
	"fmt"
	"iLeon/microservices/models"
	"iLeon/microservices/service"

	"github.com/nats-io/nats.go"
)

// NestJS ClientProxy expects responses as {"response":..., "id":..., "isDisposed":true, "err":null}
type natsResponse struct {
	Response   any    `json:"response"`
	ID         string `json:"id"`
	IsDisposed bool   `json:"isDisposed"`
	Err        any    `json:"err"`
}

func reply(nc *nats.Conn, msg *nats.Msg, id string, response any) {
	data, _ := json.Marshal(natsResponse{
		Response:   response,
		ID:         id,
		IsDisposed: true,
		Err:        nil,
	})
	nc.Publish(msg.Reply, data)
}

func GetAllCustomers(nc *nats.Conn, s service.CustomerService) {
	nc.Subscribe("customers.findCustomers", func(msg *nats.Msg) {
		// Extract id from NestJS message
		var req struct {
			ID string `json:"id"`
		}
		json.Unmarshal(msg.Data, &req)

		customers, err := s.FetchCustomers()
		if err != nil {
			fmt.Println("Something bad occured while trying to fetch customers")
			reply(nc, msg, req.ID, nil)
			return
		}

		reply(nc, msg, req.ID, customers)
	})

	nc.Flush()
}

func GetCustomer(nc *nats.Conn, s service.CustomerService) {
	nc.Subscribe("customers.findCustomer", func(msg *nats.Msg) {
		var payload models.Payload
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			fmt.Println("GetCustomer unmarshal error:", err)
			reply(nc, msg, "", map[string]string{"error": err.Error()})
			return
		}

		customer, err := s.FetchCustomer(payload.Data)
		if err != nil {
			fmt.Println("GetCustomer fetch error:", err)
			reply(nc, msg, payload.Id, nil)
			return
		}

		reply(nc, msg, payload.Id, customer)
	})

	nc.Flush()
}

func CreateCustomer(nc *nats.Conn, s service.CustomerService) {
	nc.Subscribe("customers.createCustomer", func(msg *nats.Msg) {
		var payload models.CreateCustomerPayload
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			fmt.Println("CreateCustomer unmarshal error:", err)
			reply(nc, msg, "", map[string]string{"error": err.Error()})
			return
		}

		createdCustomer, err := s.InsertCustomer(payload.Data)
		if err != nil {
			fmt.Println("CreateCustomer insert error:", err)
			reply(nc, msg, payload.Id, map[string]string{"error": err.Error()})
			return
		}

		reply(nc, msg, payload.Id, createdCustomer)
	})
}

func UpdateCustomer(nc *nats.Conn, s service.CustomerService) {
	nc.Subscribe("customers.updateCustomer", func(msg *nats.Msg) {
		var payload models.UpdateCustomerPayload
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			fmt.Println("UpdateCustomer unmarshal error:", err)
			reply(nc, msg, "", map[string]string{"error": err.Error()})
			return
		}

		updatedCustomer, err := s.ChangeCustomer(payload.Data.Customer, payload.Data.Id)
		if err != nil {
			fmt.Println("UpdateCustomer change error:", err)
			reply(nc, msg, payload.Id, map[string]string{"error": err.Error()})
			return
		}

		reply(nc, msg, payload.Id, updatedCustomer)
	})
}

func DeleteCustomer() {}
