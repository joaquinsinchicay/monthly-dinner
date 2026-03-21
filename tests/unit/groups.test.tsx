import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createGroupMock = jest.fn();

jest.mock("@/app/actions/groups", () => ({
  createGroup: (...args: unknown[]) => createGroupMock(...args)
}));

import { CreateGroupForm } from "@/components/group/CreateGroupForm";

describe("CreateGroupForm", () => {
  beforeEach(() => {
    createGroupMock.mockReset();
  });

  it("shows inline validation when name is missing and does not call the server action", async () => {
    const user = userEvent.setup();
    render(<CreateGroupForm />);

    await user.click(screen.getByRole("button", { name: /crear grupo/i }));

    expect(await screen.findByText("El nombre del grupo es obligatorio")).toBeInTheDocument();
    expect(createGroupMock).not.toHaveBeenCalled();
  });

  it("keeps the typed value and renders server validation errors", async () => {
    const user = userEvent.setup();
    createGroupMock.mockResolvedValue({ error: "El nombre del grupo es obligatorio" });
    render(<CreateGroupForm />);

    const input = screen.getByLabelText("Nombre del grupo");
    await user.type(input, "Cena mensual");
    await user.click(screen.getByRole("button", { name: /crear grupo/i }));

    expect(await screen.findByText("El nombre del grupo es obligatorio")).toBeInTheDocument();
    expect(input).toHaveValue("Cena mensual");
    expect(createGroupMock).toHaveBeenCalledTimes(1);
  });
});
