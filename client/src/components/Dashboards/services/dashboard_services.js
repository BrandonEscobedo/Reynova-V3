import {getFunctions, httpsCallable} from "firebase/functions";
import {app} from "../../../firebase";

const functions = getFunctions(app);

const getDashboardData = async (fechas) => {
  const payload = {
    fechaInicio: fechas?.fechaInicio ?? "",
    fechaFin: fechas?.fechaFin ?? "",
  };
  const callCloudFunction = httpsCallable(functions, "getDashboardData");
  const result = await callCloudFunction(payload);
  return result.data;
};

const getClientesStatus = async () => {
  const callCloudFunction = httpsCallable(functions, "getClientesStatus");
  const result = await callCloudFunction();
  return result.data;
};

export const dashboardService = {
  getDashboardData,
  getClientesStatus,
};