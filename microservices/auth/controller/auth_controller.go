package controller

import (
	"encoding/json"
	"fmt"
	"iLeon/microservices/auth/models"
	"iLeon/microservices/auth/service"

	"github.com/nats-io/nats.go"
)

func LoginUser(nc *nats.Conn, s service.AuthService) {
	nc.Subscribe("LoginUser", func(msg *nats.Msg) {
		var payload models.LoginUserPayload
		err := json.Unmarshal(msg.Data, &payload)

		if err != nil {
			fmt.Println("Couldn't unmarshal the data")
		}

		response := s.LoginUser(payload.Data)

		data, _ := json.Marshal(response)

		nc.Publish(msg.Reply, data)

	})

	nc.Flush()
}

func RegisterUser(nc *nats.Conn, s service.AuthService) {
	nc.Subscribe("RegisterUser", func(msg *nats.Msg) {

		var payload models.CreateUserPayload
		err := json.Unmarshal(msg.Data, &payload)

		if err != nil {
			fmt.Println("Coudln't unmarshal the data")
		}

		response := s.RegisterUser(payload.Data)
		data, _ := json.Marshal(response)
		nc.Publish(msg.Reply, data)

	})

	nc.Flush()
}
