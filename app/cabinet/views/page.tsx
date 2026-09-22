import { Card } from "@heroui/react";
import { Header } from "../_components/shell";

export default function CabinetStub() {
  return (
    <>
      <Header title="Просмотры" />
      <Card>
        <Card.Content>
          <p className="text-sm text-muted">
            Просмотры по площадкам появятся вместе с кассой: пока цифры живут на главной.
          </p>
        </Card.Content>
      </Card>
    </>
  );
}
