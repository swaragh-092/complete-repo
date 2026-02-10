import { Box } from "@mui/material";
import ProjectHealthSummary from "./ProjectHealthSummary";
import Heading from "../../../components/Heading";
import ExecutiveSnapshot from "./ExecutiveSnapshot";
import DeliveryRiskSnapshot from "./DeliveryRiskSnapshot";
import QuickActionsPanel from "./QuickActionsPanel";

export default function AdminDashboard ({data, loading}) {
    return (
        <>
            <Box padding={2}>
                <ExecutiveSnapshot data={data} loading={loading} />
                
                <ProjectHealthSummary projects={data?.healthoverview?.projects} loading={loading} />

                <Heading title={"Delivery Risk Snapshot"} level={3} />
                <DeliveryRiskSnapshot data={data?.deliverySnapshot} loading={loading} />
                <QuickActionsPanel />
            </Box>
        </>
    ) ;
}