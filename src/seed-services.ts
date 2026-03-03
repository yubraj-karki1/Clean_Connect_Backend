import { connectDB } from "./database/mongodb";
import { ServiceModel } from "./models/service.model";

async function seedServices() {
  await connectDB();
  const services = [
    { title: "Home Cleaning", hourlyRate: 20 },
    { title: "Office Cleaning", hourlyRate: 25 },
    { title: "Carpet Cleaning", hourlyRate: 30 },
    { title: "Deep Cleaning", hourlyRate: 35 },
    { title: "Window Cleaning", hourlyRate: 18 },
    { title: "Water Tank Cleaning", hourlyRate: 22 },
    { title: "Move-in/out", hourlyRate: 40 },
  ];
  for (const service of services) {
    const exists = await ServiceModel.findOne({ title: service.title });
    if (!exists) {
      await ServiceModel.create(service);
      console.log(`Added: ${service.title}`);
    } else {
      console.log(`Exists: ${service.title}`);
    }
  }
  console.log("Service seeding complete.");
  process.exit(0);
}

seedServices();
