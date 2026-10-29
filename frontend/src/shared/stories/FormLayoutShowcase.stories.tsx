import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { Form } from "@ui/form/Form";
import { Box } from "@ui/layout/Box";
import { Flex } from "@ui/layout/Flex";
import { Grid } from "@ui/layout/Grid";
import { VStack } from "@ui/layout/VStack";
import { GridItem } from "@ui/layout/Grid";
import { Text } from "@ui/atoms/Text";
import { Button } from "@ui/button";
import { Modal } from "@ui/overlay/Modal";
import { ToastContainer } from "@ui/Toast/ToastContainer";
import { toastSuccess, toastError } from "@ui/Toast/toast";

const meta: Meta = {
  title: "Showcase/Form + Layout Integration",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

export const CompleteForm: Story = {
  render: () => (
    <Box className="w-full max-w-3xl">
      <VStack gap="lg" mb="lg">
        <Text variant="h1">User Registration</Text>
        <Text variant="body" color="textMuted">Complete form with layout primitives</Text>
      </VStack>

      <Form
        definition={{
          id: "registration-form",
          title: "Create Account",
          description: "Fill in your details to get started",
          settings: { density: "comfortable" },
          sections: [
            {
              id: "personal",
              title: "Personal Information",
              layout: { type: "grid", columns: 12, gap: "md" },
              fields: [
                { id: "firstName", name: "firstName", type: "text", label: "First Name", required: true, layout: { columnSpan: 6 } },
                { id: "lastName", name: "lastName", type: "text", label: "Last Name", required: true, layout: { columnSpan: 6 } },
                { id: "email", name: "email", type: "email", label: "Email", required: true, layout: { columnSpan: 12 } },
                { id: "phone", name: "phone", type: "phone", label: "Phone", layout: { columnSpan: 6 } },
                { id: "company", name: "company", type: "text", label: "Company", layout: { columnSpan: 6 } },
              ],
            },
            {
              id: "address",
              title: "Address",
              layout: { type: "grid", columns: 12, gap: "md" },
              fields: [
                { id: "address", name: "address", type: "text", label: "Street Address", layout: { columnSpan: 12 } },
                { id: "city", name: "city", type: "text", label: "City", layout: { columnSpan: 6 } },
                { id: "state", name: "state", type: "text", label: "State", layout: { columnSpan: 3 } },
                { id: "zip", name: "zip", type: "text", label: "ZIP Code", layout: { columnSpan: 3 } },
              ],
            },
            {
              id: "preferences",
              title: "Preferences",
              layout: { type: "grid", columns: 12, gap: "md" },
              fields: [
                { id: "notifications", name: "notifications", type: "switch", label: "Email notifications", layout: { columnSpan: 6 } },
                { id: "newsletter", name: "newsletter", type: "switch", label: "Newsletter", layout: { columnSpan: 6 } },
                { id: "theme", name: "theme", type: "select", label: "Theme", layout: { columnSpan: 4 }, options: [
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System" },
                ]},
              ],
            },
          ],
          submitLabel: "Create Account",
          cancelLabel: "Cancel",
        }}
        onSubmit={async (data) => {
          console.log("Form submitted:", data);
          await new Promise(r => setTimeout(r, 1000));
          toastSuccess("Account created!", "Welcome to the platform");
        }}
      />
    </Box>
  ),
};

export const FormInModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="lg">
            <Modal.Header>Create New Project</Modal.Header>
            <Modal.Body>
              <Form
                definition={{
                  id: "project-form",
                  settings: { density: "comfortable" },
                  sections: [
                    {
                      id: "details",
                      title: "Project Details",
                      layout: { type: "grid", columns: 12, gap: "md" },
                      fields: [
                        { id: "name", name: "name", type: "text", label: "Project Name", required: true, layout: { columnSpan: 12 } },
                        { id: "description", name: "description", type: "textarea", label: "Description", layout: { columnSpan: 12 } },
                        { id: "type", name: "type", type: "select", label: "Type", layout: { columnSpan: 6 }, options: [
                          { value: "web", label: "Web App" },
                          { value: "mobile", label: "Mobile App" },
                          { value: "api", label: "API Service" },
                        ]},
                        { id: "priority", name: "priority", type: "select", label: "Priority", layout: { columnSpan: 6 }, options: [
                          { value: "low", label: "Low" },
                          { value: "medium", label: "Medium" },
                          { value: "high", label: "High" },
                        ]},
                      ],
                    },
                  ],
                  submitLabel: "Create",
                  cancelLabel: "Cancel",
                }}
                onSubmit={async (data) => {
                  console.log("Project created:", data);
                  await new Promise(r => setTimeout(r, 1000));
                  toastSuccess("Project created!", "Your project is ready");
                  setIsOpen(false);
                }}
              />
            </Modal.Body>
          </Modal>
        )}
      </>
    );
  },
};

export const MultiStepWizard: Story = {
  render: () => {
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({});

    const steps = [
      { id: 1, title: "Account", fields: ["email", "password"] },
      { id: 2, title: "Profile", fields: ["firstName", "lastName", "bio"] },
      { id: 3, title: "Preferences", fields: ["theme", "notifications"] },
      { id: 4, title: "Confirm", fields: [] },
    ];

    return (
      <Box className="w-full max-w-2xl">
        <VStack gap="lg" mb="lg">
          <Flex justify="between" align="center">
            <VStack gap="xs">
              <Text variant="h1">Setup Wizard</Text>
              <Text variant="caption" color="textMuted">Step {step} of {steps.length}</Text>
            </VStack>
          </Flex>

          <Flex gap="sm">
            {steps.map((s, i) => (
              <Flex key={s.id} align="center" gap="sm" className="flex-1">
                <Box
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i + 1 < step ? "bg-green-500 text-white" :
                    i + 1 === step ? "bg-blue-500 text-white" :
                    "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1 < step ? "✓" : i + 1}
                </Box>
                {i < steps.length - 1 && <Box className="flex-1 h-1 bg-gray-200" />}
              </Flex>
            ))}
          </Flex>

          <Box variant="card" p="xl">
            {step === 1 && (
              <VStack gap="md">
                <Text variant="h3" mb="md">Create Your Account</Text>
                <Grid columns={12} gap="md">
                  <GridItem colSpan={6}>
                    <VStack gap="xs">
                      <Text variant="label" bold>Email</Text>
                      <input className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
                    </VStack>
                  </GridItem>
                  <GridItem colSpan={6}>
                    <VStack gap="xs">
                      <Text variant="label" bold>Password</Text>
                      <input type="password" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                    </VStack>
                  </GridItem>
                </Grid>
              </VStack>
            )}
            {step === 2 && (
              <VStack gap="md">
                <Text variant="h3" mb="md">Profile Information</Text>
                <Grid columns={12} gap="md">
                  <GridItem colSpan={6}>
                    <VStack gap="xs">
                      <Text variant="label" bold>First Name</Text>
                      <input className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="John" />
                    </VStack>
                  </GridItem>
                  <GridItem colSpan={6}>
                    <VStack gap="xs">
                      <Text variant="label" bold>Last Name</Text>
                      <input className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Doe" />
                    </VStack>
                  </GridItem>
                  <GridItem colSpan={12}>
                    <VStack gap="xs">
                      <Text variant="label" bold>Bio</Text>
                      <textarea rows={3} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Tell us about yourself..." />
                    </VStack>
                  </GridItem>
                </Grid>
              </VStack>
            )}
            {step === 3 && (
              <VStack gap="md">
                <Text variant="h3" mb="md">Preferences</Text>
                <Grid columns={12} gap="md">
                  <GridItem colSpan={6}>
                    <VStack gap="xs">
                      <Text variant="label" bold>Theme</Text>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </VStack>
                  </GridItem>
                  <GridItem colSpan={6}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Email notifications</span>
                    </label>
                  </GridItem>
                  <GridItem colSpan={6}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Push notifications</span>
                    </label>
                  </GridItem>
                </Grid>
              </VStack>
            )}
            {step === 4 && (
              <VStack gap="md" align="center">
                <Box className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Text variant="h1" color="green">✓</Text>
                </Box>
                <Text variant="h2" align="center">All Set!</Text>
                <Text variant="body" color="textMuted" align="center">Your account is ready to use.</Text>
              </VStack>
            )}
          </Box>

          <Flex justify="between">
            <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>Back</Button>
            <Button onClick={() => {
              if (step < steps.length) setStep(s => s + 1);
              else toastSuccess("Setup complete!", "Welcome aboard!");
            }}>
              {step < steps.length ? "Next" : "Finish"}
            </Button>
          </Flex>
        </VStack>
      </Box>
    );
  },
};

export const FormWithToasts: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Box className="w-full max-w-md space-y-4">
        <VStack gap="lg" mb="lg">
          <Text variant="h1">Form with Toast Notifications</Text>
          <Text variant="body" color="textMuted">Demonstrates toast integration with form actions</Text>
        </VStack>

        <Box variant="card" p="lg">
          <VStack gap="md">
            <Text variant="h3">Contact Form</Text>
            <VStack gap="md">
              <VStack gap="xs">
                <Text variant="label" bold>Name</Text>
                <input className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Your name" />
              </VStack>
              <VStack gap="xs">
                <Text variant="label" bold>Email</Text>
                <input type="email" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
              </VStack>
              <VStack gap="xs">
                <Text variant="label" bold>Message</Text>
                <textarea rows={3} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Your message..." />
              </VStack>
            </VStack>
            <Flex gap="md">
              <Button variant="ghost" onClick={() => toastError("Failed", "Please fill all fields")}>Cancel</Button>
              <Button onClick={() => toastSuccess("Sent!", "We'll get back to you soon")}>Send Message</Button>
            </Flex>
          </VStack>
        </Box>
      </Box>
    </>
  ),
};