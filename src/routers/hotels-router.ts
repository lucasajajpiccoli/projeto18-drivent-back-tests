import { Router } from "express";
import { getHotelWithRoomsSchema } from "@/schemas";
import { authenticateToken, validateParams } from "@/middlewares";
import { getHotels, getHotelWithRooms } from "@/controllers";

const hotelsRouter = Router();

hotelsRouter
  .all("/*", authenticateToken)
  .get("", getHotels)
  .get("/:hotelId", validateParams(getHotelWithRoomsSchema), getHotelWithRooms);

export { hotelsRouter };
