async function createBazaar(data,user){ // data is the data from the frontend and user is the user who is creating the bazaar(events office)
    //check user role
    if (user.role !== 'EventsOffice') {
        throw new Error('Only Events Office can create bazaars');
      }
    const bazaarData ={
        name: data.name,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        registrationDeadline: data.registrationDeadline,
        eventType:"bazaar",
        createdBy : user._id

    }      
    const bazaar = await Event.create(data)
    return bazaar;
}