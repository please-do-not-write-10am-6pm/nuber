import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Coords } from "../types/types";
import User from "./User";

const CASH = "CASH";
const CARD = "CARD";

const ACCEPTED = "ACCEPTED";
const ONROUTE = "ONROUTE";
const FINISHED = "FINISHED";
const CANCELED = "CANCELED";
const REQUESTING = "REQUESTING";

@Entity()
class Ride extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({
    type: "text",
    enum: [ACCEPTED, ONROUTE, FINISHED, CANCELED, REQUESTING],
    default: REQUESTING
  })
  status: string;

  @Column({ type: "float", nullable: true })
  driverRating: number;

  @Column({ type: "float", nullable: true })
  passengerRating: number;

  @ManyToOne(type => User, user => user.ridesAsPassenger)
  passenger: User;

  @ManyToOne(type => User, user => user.ridesAsDriver)
  driver: User;

  @Column({ type: "text" })
  pickUpLocation: string;

  @Column({ type: "json" })
  pickUpCoords: Coords;

  @Column({ type: "text" })
  dropOffLocation: string;

  @Column({ type: "json" })
  dropOffCoords: Coords;

  @Column({ type: "json", nullable: true })
  drivePath: string;

  @Column({ type: "decimal" })
  price: number;

  @Column({ type: "text", nullable: true })
  distance: string;

  @Column({ type: "text", nullable: true })
  duration: string;

  @Column({ type: "text", enum: [CASH, CARD], default: CASH })
  paymentMethod: string;

  @CreateDateColumn() createdAt: string;
  @UpdateDateColumn() updatedAt: string;
}
export default Ride;
