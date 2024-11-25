package models

type CreateUserBody struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginUserBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateUserPayload struct {
	Data CreateUserBody `json:"data"`
}

type LoginUserPayload struct {
	Data LoginUserBody `json:"data"`
}

type CustomeResponse struct {
	Msg     string `json:"message"`
	Context bool   `json:"context"`
}
