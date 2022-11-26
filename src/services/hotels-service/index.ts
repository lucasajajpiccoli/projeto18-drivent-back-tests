import { forbiddenError } from "@/errors";
import hotelRepository from "@/repositories/hotel-repository";
import userRepository from "@/repositories/user-repository";
import { Hotel, TicketStatus } from "@prisma/client";

async function isAllowed(userId: number): Promise<boolean> {
  const userWithTicketTypeByUserId = await userRepository.findUserWithTicketTypeByUserId(userId);
  
  const ticketWithTicketType = userWithTicketTypeByUserId.Enrollment?.[0].Ticket?.[0];
  const ticketType = ticketWithTicketType?.TicketType;
  
  if(!ticketType) {
    return false;
  }

  const isPaidTicket = ticketWithTicketType.status === TicketStatus.PAID;
  const isHostableTicket = ( !ticketType.isRemote && ticketType.includesHotel );
  const isPaidAndHostableTicket = ( isPaidTicket && isHostableTicket );

  if(!isPaidAndHostableTicket) {
    return false;
  }

  return true;
}

async function getHotels(userId: number): Promise<Hotel[]> {
  const allowed = await isAllowed(userId);

  if(!allowed) {
    throw forbiddenError();
  }

  const hotels = await hotelRepository.findHotels();

  return hotels;
}

const hotelService = {
  getHotels
};

export default hotelService;
