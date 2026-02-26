package controller

import (
	"encoding/json"
	"fmt"
	"iLeon/microservices/auth/models"
	"iLeon/microservices/auth/service"

	"github.com/nats-io/nats.go"
)

// NestJS ClientProxy wraps messages as {"pattern":..., "data":..., "id":...}
// and expects responses as {"response":..., "id":..., "isDisposed":true, "err":null}
type natsRequest struct {
	ID   string          `json:"id"`
	Data json.RawMessage `json:"data"`
}

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

func LoginUser(nc *nats.Conn, s service.AuthService) {
	nc.Subscribe("auth.loginUser", func(msg *nats.Msg) {
		var req natsRequest
		if err := json.Unmarshal(msg.Data, &req); err != nil {
			fmt.Println("Couldn't unmarshal NATS request:", err)
			return
		}

		var body models.LoginUserBody
		if err := json.Unmarshal(req.Data, &body); err != nil {
			fmt.Println("Couldn't unmarshal login payload:", err)
			return
		}

		response := s.LoginUser(body)
		reply(nc, msg, req.ID, response)
	})

	nc.Flush()
}

func RegisterUser(nc *nats.Conn, s service.AuthService) {
	nc.Subscribe("auth.registerUser", func(msg *nats.Msg) {
		var req natsRequest
		if err := json.Unmarshal(msg.Data, &req); err != nil {
			fmt.Println("Couldn't unmarshal NATS request:", err)
			return
		}

		var body models.CreateUserBody
		if err := json.Unmarshal(req.Data, &body); err != nil {
			fmt.Println("Couldn't unmarshal register payload:", err)
			return
		}

		response := s.RegisterUser(body)
		reply(nc, msg, req.ID, response)
	})

	nc.Flush()
}
