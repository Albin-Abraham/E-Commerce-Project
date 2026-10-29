import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Box } from "@ui/layout/Box";
import { Flex } from "@ui/layout/Flex";
import { Grid, GridItem } from "@ui/layout/Grid";
import { VStack } from "@ui/layout/VStack";
import { Layer } from "@ui/layout/Layer";
import { Text } from "@ui/atoms/Text";
import { Button } from "@ui/button";
import { CardSkeleton } from "@ui/common/CardSkeleton";

const meta: Meta = {
  title: "Showcase/Layout Primitives",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

export const DashboardLayout: Story = {
  render: () => (
    <Box className="w-full max-w-6xl space-y-6">
      <VStack gap="lg">
        <Flex justify="between" align="center">
          <VStack gap="xs">
            <Text variant="h1" color="foreground">Dashboard</Text>
            <Text variant="caption" color="muted">Overview of your metrics</Text>
          </VStack>
          <Button variant="primary">New Project</Button>
        </Flex>

        <Grid columns={12} gap="lg">
          <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
            <Box variant="card" p="lg" className="text-center">
              <Text variant="caption" bold color="primary">Total Users</Text>
              <Text variant="h1" bold color="foreground">12,345</Text>
              <Text variant="caption" bold color="success">+12% from last month</Text>
            </Box>
          </GridItem>
          <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
            <Box variant="card" p="lg" className="text-center">
              <Text variant="caption" bold color="primary">Revenue</Text>
              <Text variant="h1" bold color="foreground">$98,765</Text>
              <Text variant="caption" bold color="success">+8% from last month</Text>
            </Box>
          </GridItem>
          <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
            <Box variant="card" p="lg" className="text-center">
              <Text variant="caption" bold color="primary">Orders</Text>
              <Text variant="h1" bold color="foreground">1,234</Text>
              <Text variant="caption" bold color="danger">-3% from last month</Text>
            </Box>
          </GridItem>
          <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
            <Box variant="card" p="lg" className="text-center">
              <Text variant="caption" bold color="primary">Conversion</Text>
              <Text variant="h1" bold color="foreground">3.2%</Text>
              <Text variant="caption" bold color="success">+0.5% from last month</Text>
            </Box>
          </GridItem>
        </Grid>

        <Grid columns={12} gap="lg">
          <GridItem colSpan={{ base: 12, lg: 8 }}>
            <Box variant="card" p="lg">
              <Flex justify="between" align="center" className="mb-4">
                <Text variant="h3" color="foreground">Recent Activity</Text>
                <Button variant="ghost" size="sm">View All</Button>
              </Flex>
              <VStack gap="md">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Flex key={i} justify="between" align="center" p="md" className="bg-subtle rounded-lg border border-border/50">
                    <Flex align="center" gap="md">
                      <Box className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Text variant="caption" bold color="primary">A</Text>
                      </Box>
                      <VStack gap="xs">
                        <Text variant="body" bold color="foreground">User {i + 1} signed up</Text>
                        <Text variant="caption" color="muted">2 minutes ago</Text>
                      </VStack>
                    </Flex>
                    <Text variant="caption" bold color="success">New</Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </GridItem>
          <GridItem colSpan={{ base: 12, lg: 4 }}>
            <Box variant="card" p="lg">
              <Text variant="h3" color="foreground" className="mb-4">Quick Actions</Text>
              <VStack gap="sm">
                <Button className="w-full justify-start" variant="outline">Create Report</Button>
                <Button className="w-full justify-start" variant="outline">Export Data</Button>
                <Button className="w-full justify-start" variant="outline">Manage Users</Button>
                <Button className="w-full justify-start" variant="outline">Settings</Button>
              </VStack>
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <Box className="w-full max-w-4xl">
      <VStack gap="lg" className="mb-6">
        <Text variant="h1" color="foreground">Card Grid Layout</Text>
        <Text variant="body" color="muted">Responsive grid using Grid and GridItem primitives</Text>
      </VStack>
      <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
        {Array.from({ length: 6 }).map((_, i) => (
          <GridItem key={i} colSpan={{ base: 1, md: 1, lg: 1 }}>
            <Box variant="card" p="lg" className="h-full flex flex-col">
              <Box className="w-full h-32 bg-subtle rounded-lg mb-4" />
              <Text variant="h3" bold color="foreground" className="mb-2">Card Title {i + 1}</Text>
              <Text variant="body" color="muted" className="flex-1">
                This is a sample card description that shows how the Grid primitive
                creates responsive layouts.
              </Text>
              <Button variant="outline" className="mt-4 w-full">Learn More</Button>
            </Box>
          </GridItem>
        ))}
      </Grid>
    </Box>
  ),
};

export const FormLayout: Story = {
  render: () => (
    <Box className="w-full max-w-2xl">
      <VStack gap="lg" className="mb-6">
        <Text variant="h1" color="foreground">Contact Form</Text>
        <Text variant="body" color="muted">Form layout using VStack and Grid primitives</Text>
      </VStack>
      <Box variant="card" p="xl">
        <VStack gap="lg">
          <Grid columns={12} gap="md">
            <GridItem colSpan={6}>
              <VStack gap="xs">
                <Text variant="body" bold color="foreground">First Name</Text>
                <input className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="John" />
              </VStack>
            </GridItem>
            <GridItem colSpan={6}>
              <VStack gap="xs">
                <Text variant="body" bold color="foreground">Last Name</Text>
                <input className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Doe" />
              </VStack>
            </GridItem>
            <GridItem colSpan={12}>
              <VStack gap="xs">
                <Text variant="body" bold color="foreground">Email</Text>
                <input type="email" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="john@example.com" />
              </VStack>
            </GridItem>
            <GridItem colSpan={12}>
              <VStack gap="xs">
                <Text variant="body" bold color="foreground">Message</Text>
                <textarea rows={4} className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Your message..." />
              </VStack>
            </GridItem>
          </Grid>
          <Flex justify="end" gap="md">
            <Button variant="ghost">Cancel</Button>
            <Button>Send Message</Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  ),
};

export const HeroSection: Story = {
  render: () => (
    <Box className="relative bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl p-12 md:p-20 text-white">
      <Layer position="absolute" inset className="bg-black/10 rounded-2xl" />
      <VStack gap="md" className="relative z-10 max-w-2xl">
        <Text variant="caption" bold className="text-white/80">New Release</Text>
        <Text variant="hero" className="text-white text-4xl md:text-5xl lg:text-6xl">Build Better Products Faster</Text>
        <Text variant="bodyLarge" className="text-white/90 max-w-xl">
          Our platform provides the tools you need to design, develop, and deploy
          world-class applications with confidence.
        </Text>
        <Flex gap="md" wrap>
          <Button variant="primary" size="lg">Get Started Free</Button>
          <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">Watch Demo</Button>
        </Flex>
      </VStack>
    </Box>
  ),
};

export const PricingTable: Story = {
  render: () => (
    <Box className="w-full max-w-4xl">
      <VStack gap="lg" className="mb-6 text-center">
        <Text variant="h1" color="foreground">Simple, Transparent Pricing</Text>
        <Text variant="bodyLarge" color="muted">Choose the plan that's right for you</Text>
      </VStack>
      <Grid columns={{ base: 1, md: 3 }} gap="lg">
        <Box variant="card" p="xl" className="flex flex-col">
          <Text variant="h3" bold color="foreground">Free</Text>
          <Text variant="hero" bold color="foreground" className="my-4">$0<span className="text-sm font-normal text-muted">/month</span></Text>
          <VStack gap="sm" className="flex-1">
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Up to 3 projects</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">1 GB storage</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Community support</Text></Flex>
          </VStack>
          <Button variant="outline" className="w-full mt-4">Get Started</Button>
        </Box>
        <Box variant="card" p="xl" className="flex flex-col relative">
          <Layer position="absolute" top={-12} left="1/2" className="-translate-x-1/2">
            <Box className="bg-warning text-white px-3 py-1 rounded-full text-xs font-bold">Most Popular</Box>
          </Layer>
          <Text variant="h3" bold color="foreground">Pro</Text>
          <Text variant="hero" bold color="foreground" className="my-4">$29<span className="text-sm font-normal text-muted">/month</span></Text>
          <VStack gap="sm" className="flex-1">
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Unlimited projects</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">100 GB storage</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Priority support</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Advanced analytics</Text></Flex>
          </VStack>
          <Button variant="primary" className="w-full mt-4">Start Free Trial</Button>
        </Box>
        <Box variant="card" p="xl" className="flex flex-col">
          <Text variant="h3" bold color="foreground">Enterprise</Text>
          <Text variant="hero" bold color="foreground" className="my-4">Custom</Text>
          <VStack gap="sm" className="flex-1">
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Everything in Pro</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Unlimited storage</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Dedicated support</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">Custom integrations</Text></Flex>
            <Flex align="center" gap="sm"><Text variant="caption" color="success">✓</Text><Text variant="body" color="muted">SLA guarantee</Text></Flex>
          </VStack>
          <Button variant="outline" className="w-full mt-4">Contact Sales</Button>
        </Box>
      </Grid>
    </Box>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <Box className="w-full max-w-2xl space-y-8">
      <VStack gap="lg">
        <Text variant="h1" color="foreground">Loading States</Text>
        <Text variant="body" color="muted">Using CardSkeleton for consistent loading experience</Text>
      </VStack>

      <VStack gap="md">
        <Text variant="h3" color="foreground">Dashboard Cards</Text>
        <Grid columns={{ base: 1, md: 2, lg: 4 }} gap="md">
          <CardSkeleton count={4} density="comfortable" />
        </Grid>
      </VStack>

      <VStack gap="md">
        <Text variant="h3" color="foreground">Form Fields</Text>
        <Box variant="card" p="lg">
          <VStack gap="md">
            <Box className="h-6 bg-subtle rounded w-1/3 animate-pulse" />
            <Box className="h-10 bg-subtle rounded animate-pulse" />
            <Box className="h-10 bg-subtle rounded animate-pulse" />
            <Box className="h-10 bg-subtle rounded animate-pulse" />
            <Box className="h-10 bg-subtle rounded w-1/3 animate-pulse" />
          </VStack>
        </Box>
      </VStack>
    </Box>
  ),
};