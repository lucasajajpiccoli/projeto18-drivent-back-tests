import Joi from "joi";

export const getHotelWithRoomsSchema = Joi.object({
  hotelId: Joi.string().pattern(/^[0-9]+$/, { name: "digits" }).required()
});
