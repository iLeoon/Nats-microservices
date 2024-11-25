package models

type Customer struct {
	CustomerID  string  `json:"customer_id"`
	ContactName *string `json:"contact_name,omitempty"`
	City        *string `json:"city,omitempty"`
	Country     *string `json:"country,omitempty"`
}

type Payload struct {
	Pattern string `json:"pattern"`
	Data    string `json:"data"`
	Id      string `json:"id"`
}

type CreateCustomerPayload struct {
	Pattern string    `json:"pattern"`
	Data    *Customer `json:"data"`
	Id      string    `json:"id"`
}

type UpdatePayload struct {
	Customer *Customer `json:"customer"`
	Id       string    `json:"id"`
}

type UpdateCustomerPayload struct {
	Pattern string        `json:"pattern"`
	Data    UpdatePayload `json:"data"`
	Id      string        `json:"id"`
}
