import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() })
}));

jest.mock("@/app/actions/events", () => ({
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  publishEvent: jest.fn(),
  notifyGroupOfUpdate: jest.fn(),
  updateAttendance: jest.fn()
}));

import { CreateEventForm } from "@/components/event/CreateEventForm";

describe("CreateEventForm", () => {
  it("shows inline validation when date is missing", async () => {
    const user = userEvent.setup();
    render(<CreateEventForm mode="create" />);

    await user.click(screen.getByRole("button", { name: /guardar evento/i }));

    expect(await screen.findByText("La fecha es obligatoria para crear el evento")).toBeInTheDocument();
  });
});
