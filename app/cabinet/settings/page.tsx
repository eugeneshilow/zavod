import { Card } from "@heroui/react";
import { Header } from "../_components/shell";

export default function CabinetStub() {
  return (
    <>
      <Header title="Настройки" />
      <Card>
        <Card.Content>
          <p className="text-sm text-muted">
            Голос, площадки и уведомления настраиваются после входа по ссылке на почту.
          </p>
        </Card.Content>
      </Card>
    </>
  );
}
