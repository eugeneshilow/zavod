import { Card } from "@heroui/react";
import { Header } from "../_components/shell";

export default function CabinetStub() {
  return (
    <>
      <Header title="Платежи" />
      <Card>
        <Card.Content>
          <p className="text-sm text-muted">Платежи появятся вместе с кассой.</p>
        </Card.Content>
      </Card>
    </>
  );
}
