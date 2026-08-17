import { createCompanyForUser } from "../server/db";

const result = await createCompanyForUser({
  userId: 1,
  name: "Repair Lubatec",
  nif: "5001121871",
  functionalCurrency: "AOA",
  ivaRegime: "EXCLUSAO",
  legalForm: "Sociedade por Quotas",
  address: "Shopping Millennium, Loja 141",
  municipality: "Lubango",
  province: "Huíla",
  phone: "+244 921346544",
  email: "repairlubatec@gmail.com",
  activity: "Prestação de Serviço",
  incorporationYear: 2023,
});

console.log(JSON.stringify(result, null, 2));
