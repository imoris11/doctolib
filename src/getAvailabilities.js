import moment from "moment";
import knex from "knexClient";

export default async function getAvailabilities(date, numberOfDays = 7) {
  const availabilities = new Map();
  for (let i = 0; i < numberOfDays; ++i) {
    const tmpDate = moment(date).add(i, "days");
    availabilities.set(tmpDate.format("d"), {
      date: tmpDate.toDate(),
      slots: []
    });
  }

  const events = await knex
    .select("kind", "starts_at", "ends_at", "weekly_recurring")
    .from("events")
    .where(function() {
      this.where("weekly_recurring", true).orWhere("ends_at", ">", +date);
    });

   const opening = [];
   const appointments = [];
   events.forEach((event) => {
     if (event.kind === 'opening') opening.push(event)
     else if (event.kind === 'appointment') appointments.push(event);
   })

   //set openings for days
  for (const event of opening) {
    for (
      let date = moment(event.starts_at);
      date.isBefore(event.ends_at);
       date.add(30, "minutes")
    ) {
      const day = availabilities.get(date.format("d"));
        day.slots.push(date.format("H:mm"));
    }
  }
  //remove times with scheduled appointment
  for (const event of appointments) {
    for (let date = moment(event.starts_at); date.isBefore(event.ends_at);  date.add(30, "minutes")) {
      const day = availabilities.get(date.format("d"));
        day.slots = day.slots.filter(
          slot => {
            return slot.indexOf(date.format("H:mm")) === -1
          }
        );
    }
  }
  return Array.from(availabilities.values())
}
