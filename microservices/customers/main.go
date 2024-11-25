package main

import (
	"fmt"
	"iLeon/microservices/database"
	"iLeon/microservices/functions"
	repository "iLeon/microservices/repository"
	service "iLeon/microservices/service"
	"log"
	"time"

	"github.com/nats-io/nats.go"
)

func main() {

	natsUrl := nats.DefaultURL
	nc, err := nats.Connect(natsUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	fmt.Println("Connected to NATS server at", natsUrl)

	db, _ := database.Connect()
	repo := repository.NewRepo(db)
	service := service.NewService(repo)

	functions.Handler(nc, service)

	for {
		time.Sleep(10 * time.Second)
	}
}
