import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

const context: TrpcContext = {
  user: { id: 1, openId: "MSeLNDb6a4WAPVnEQYiGpH", name: "Repair Lubatec", email: "repairlubatec@gmail.com", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
};

const result = await appRouter.createCaller(context).companies.activate({ companyId: 1, confirmation: "ACTIVATE_COMPANY" });
console.log(JSON.stringify(result, null, 2));
