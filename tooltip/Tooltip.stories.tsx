import type { Meta, StoryObj } from "@storybook/react";
import ToolTipWrapper from "./ToolTipWrapper";
import { TooltipProvider } from "./TooltipContext";
import React from "react";

const meta = {
    title: "Components/Tooltip",
    component: ToolTipWrapper,
    decorators: [
        (Story) => (
            <TooltipProvider>
                <div style={{ padding: "100px", minHeight: "400px" }}>
                    <Story />
                </div>
            </TooltipProvider>
        ),
    ],
    parameters: {
        layout: "fullscreen",
    },
} satisfies Meta<typeof ToolTipWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Simple text tooltip - basic usage example
 */
export const SimpleText: Story = {
    render: () => (
        <ToolTipWrapper text="This is a simple tooltip">
            <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                Hover me (simple text)
            </button>
        </ToolTipWrapper>
    ),
};

/**
 * Tooltip with custom delay before showing
 */
export const WithDelay: Story = {
    render: () => (
        <ToolTipWrapper text="Tooltip with 500ms delay" delay={500}>
            <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                Hover me (with delay)
            </button>
        </ToolTipWrapper>
    ),
};

/**
 * Tooltip with no delay - shows immediately
 */
export const NoDelay: Story = {
    render: () => (
        <ToolTipWrapper text="Tooltip with no delay" delay={0}>
            <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                Hover me (instant)
            </button>
        </ToolTipWrapper>
    ),
};

/**
 * Tooltip displaying a list of items
 */
export const ListTooltip: Story = {
    render: () => (
        <ToolTipWrapper text={["First option", "Second option", "Third option", "Fourth option"]}>
            <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                Hover me (list)
            </button>
        </ToolTipWrapper>
    ),
};

/**
 * Tooltip with custom React node content
 */
export const CustomContent: Story = {
    render: () => (
        <ToolTipWrapper
            text={
                <div style={{ padding: "5px" }}>
                    <strong style={{ display: "block", marginBottom: "5px" }}>Custom Content</strong>
                    <p style={{ margin: "5px 0" }}>This is custom content</p>
                    <small style={{ color: "#ccc" }}>with various HTML elements</small>
                </div>
            }
        >
            <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                Hover me (custom)
            </button>
        </ToolTipWrapper>
    ),
};

/**
 * Tooltip on a link element
 */
export const LinkWithTooltip: Story = {
    render: () => (
        <ToolTipWrapper text="Click to navigate to example.com" href="https://example.com">
            <a
                href="https://example.com"
                style={{
                    padding: "10px 20px",
                    textDecoration: "none",
                    color: "blue",
                    border: "1px solid blue",
                    display: "inline-block",
                    borderRadius: "4px",
                }}
            >
                Link with tooltip
            </a>
        </ToolTipWrapper>
    ),
};

/**
 * Demonstrates keyboard accessibility - use Tab to navigate
 */
export const KeyboardAccessible: Story = {
    render: () => (
        <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
            <ToolTipWrapper text="Use Tab to focus here">
                <button style={{ padding: "10px 20px" }}>Button 1 (Tab)</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Tooltip also shows on focus">
                <button style={{ padding: "10px 20px" }}>Button 2 (Tab)</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Keyboard accessibility support">
                <button style={{ padding: "10px 20px" }}>Button 3 (Tab)</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Works with links too" href="#">
                <a href="#" style={{ padding: "10px 20px", display: "inline-block", color: "blue" }}>
                    Link (Tab)
                </a>
            </ToolTipWrapper>
        </div>
    ),
};

/**
 * Multiple elements with different tooltip types
 */
export const MultipleElements: Story = {
    render: () => (
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <ToolTipWrapper text="Tooltip for button">
                <button style={{ padding: "10px 20px" }}>Button</button>
            </ToolTipWrapper>

            <ToolTipWrapper text={["Option 1", "Option 2", "Option 3"]}>
                <div
                    style={{
                        padding: "10px 20px",
                        border: "1px solid gray",
                        cursor: "pointer",
                        borderRadius: "4px",
                    }}
                >
                    Div with list
                </div>
            </ToolTipWrapper>

            <ToolTipWrapper text="Tooltip for span" as="span">
        <span
            style={{
                padding: "5px 10px",
                backgroundColor: "#f0f0f0",
                cursor: "pointer",
                borderRadius: "4px",
            }}
        >
          Span element
        </span>
            </ToolTipWrapper>

            <ToolTipWrapper text="Custom element" as="div">
                <div
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#e0f7fa",
                        cursor: "pointer",
                        borderRadius: "4px",
                    }}
                >
                    Custom div
                </div>
            </ToolTipWrapper>
        </div>
    ),
};

/**
 * Tests tooltip behavior at screen edges
 */
export const EdgeBehavior: Story = {
    render: () => (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "20px",
            }}
        >
            <ToolTipWrapper text="Tooltip on left side of screen">
                <button style={{ padding: "10px 20px" }}>Left side</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Tooltip on right side of screen">
                <button style={{ padding: "10px 20px" }}>Right side</button>
            </ToolTipWrapper>
        </div>
    ),
};

/**
 * Tests tooltip behavior at all edges and corners
 */
export const AllEdgesBehavior: Story = {
    render: () => (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
                gap: "20px",
                padding: "20px",
                height: "80vh",
            }}
        >
            <ToolTipWrapper text="Top left corner - tooltip should be bottom right">
                <button style={{ padding: "10px 20px" }}>Top Left</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Top center - tooltip should be bottom">
                <button style={{ padding: "10px 20px" }}>Top Center</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Top right corner - tooltip should be bottom left">
                <button style={{ padding: "10px 20px" }}>Top Right</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Middle left - tooltip to the right">
                <button style={{ padding: "10px 20px" }}>Middle Left</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Center - default tooltip behavior">
                <button style={{ padding: "10px 20px" }}>Center</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Middle right - tooltip to the left">
                <button style={{ padding: "10px 20px" }}>Middle Right</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Bottom left corner - tooltip should be top right">
                <button style={{ padding: "10px 20px" }}>Bottom Left</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Bottom center - tooltip should be top">
                <button style={{ padding: "10px 20px" }}>Bottom Center</button>
            </ToolTipWrapper>

            <ToolTipWrapper text="Bottom right corner - tooltip should be top left">
                <button style={{ padding: "10px 20px" }}>Bottom Right</button>
            </ToolTipWrapper>
        </div>
    ),
};

/**
 * Tooltip constrained within a container (microfrontend use case)
 */
export const InContainer: Story = {
    decorators: [
        (Story) => (
            <TooltipProvider containerId="microfrontend-container">
                <Story />
            </TooltipProvider>
        ),
    ],
    render: () => (
        <div
            id="microfrontend-container"
            style={{
                width: "600px",
                height: "400px",
                border: "2px solid #ccc",
                padding: "20px",
                margin: "50px auto",
                overflow: "hidden",
                position: "relative",
                backgroundColor: "#f9f9f9",
            }}
        >
            <h3 style={{ margin: "0 0 10px 0" }}>Microfrontend Container</h3>
            <p style={{ margin: "0 0 20px 0" }}>Tooltip is constrained to this container</p>

            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                <ToolTipWrapper text="Tooltip in container - left side">
                    <button style={{ padding: "10px 20px" }}>Left button</button>
                </ToolTipWrapper>

                <ToolTipWrapper text="Tooltip in container - center">
                    <button style={{ padding: "10px 20px" }}>Center button</button>
                </ToolTipWrapper>

                <ToolTipWrapper text="Tooltip in container - right side">
                    <button style={{ padding: "10px 20px" }}>Right button</button>
                </ToolTipWrapper>
            </div>

            <div style={{ position: "absolute", bottom: "20px", left: "20px" }}>
                <ToolTipWrapper text={["Bottom left", "Multiple lines", "In container"]}>
                    <button style={{ padding: "10px 20px" }}>Bottom Left</button>
                </ToolTipWrapper>
            </div>

            <div style={{ position: "absolute", bottom: "20px", right: "20px" }}>
                <ToolTipWrapper text="Bottom right corner in container">
                    <button style={{ padding: "10px 20px" }}>Bottom Right</button>
                </ToolTipWrapper>
            </div>

            <div style={{ position: "absolute", top: "60px", right: "20px" }}>
                <ToolTipWrapper text="Top right in container">
                    <button style={{ padding: "10px 20px" }}>Top Right</button>
                </ToolTipWrapper>
            </div>
        </div>
    ),
};

/**
 * Tooltip in a scrollable container
 */
export const ScrollableContainer: Story = {
    decorators: [
        (Story) => (
            <TooltipProvider containerId="scrollable-container">
                <Story />
            </TooltipProvider>
        ),
    ],
    render: () => (
        <div
            id="scrollable-container"
            style={{
                width: "500px",
                height: "300px",
                border: "2px solid #ccc",
                padding: "20px",
                margin: "50px auto",
                overflow: "auto",
                position: "relative",
                backgroundColor: "#f9f9f9",
            }}
        >
            <h3 style={{ margin: "0 0 10px 0" }}>Scrollable Container</h3>
            <p style={{ margin: "0 0 20px 0" }}>Scroll down to see more buttons</p>

            <div style={{ height: "800px" }}>
                <ToolTipWrapper text="Tooltip at top of container">
                    <button style={{ padding: "10px 20px", marginBottom: "20px" }}>
                        Top of container
                    </button>
                </ToolTipWrapper>

                <div style={{ marginTop: "200px" }}>
                    <ToolTipWrapper text="Tooltip in middle of container">
                        <button style={{ padding: "10px 20px", marginBottom: "20px" }}>
                            Middle of container
                        </button>
                    </ToolTipWrapper>
                </div>

                <div style={{ marginTop: "200px" }}>
                    <ToolTipWrapper text={["Scroll down", "to see this button", "at the bottom"]}>
                        <button style={{ padding: "10px 20px" }}>
                            Near bottom (scroll down)
                        </button>
                    </ToolTipWrapper>
                </div>

                <div style={{ marginTop: "100px" }}>
                    <ToolTipWrapper text="Last button at the very bottom">
                        <button style={{ padding: "10px 20px" }}>
                            Bottom of container
                        </button>
                    </ToolTipWrapper>
                </div>
            </div>
        </div>
    ),
};

/**
 * Resizable container demonstrating tooltip adaptation
 */
export const ResizableContainer: Story = {
    render: () => {
        const [containerSize, setContainerSize] = React.useState({ width: 600, height: 400 });

        return (
            <TooltipProvider containerId="resizable-container">
                <div style={{ padding: "20px" }}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "10px" }}>
                            Width: {containerSize.width}px
                            <input
                                type="range"
                                min="300"
                                max="900"
                                value={containerSize.width}
                                onChange={(e) =>
                                    setContainerSize((prev) => ({ ...prev, width: Number(e.target.value) }))
                                }
                                style={{ marginLeft: "10px", width: "200px" }}
                            />
                        </label>
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block" }}>
                            Height: {containerSize.height}px
                            <input
                                type="range"
                                min="200"
                                max="600"
                                value={containerSize.height}
                                onChange={(e) =>
                                    setContainerSize((prev) => ({ ...prev, height: Number(e.target.value) }))
                                }
                                style={{ marginLeft: "10px", width: "200px" }}
                            />
                        </label>
                    </div>

                    <div
                        id="resizable-container"
                        style={{
                            width: `${containerSize.width}px`,
                            height: `${containerSize.height}px`,
                            border: "2px solid #ccc",
                            padding: "20px",
                            overflow: "hidden",
                            position: "relative",
                            backgroundColor: "#f9f9f9",
                            transition: "width 0.3s, height 0.3s",
                        }}
                    >
                        <h3 style={{ margin: "0 0 10px 0" }}>Resizable Container</h3>
                        <p style={{ margin: "0 0 20px 0" }}>Change container size using sliders above</p>

                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                            <ToolTipWrapper text="Tooltip adjusts during resize">
                                <button style={{ padding: "10px 20px" }}>Left button</button>
                            </ToolTipWrapper>

                            <ToolTipWrapper text={["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"]}>
                                <button style={{ padding: "10px 20px" }}>Long list</button>
                            </ToolTipWrapper>
                        </div>

                        <div style={{ position: "absolute", bottom: "20px", right: "20px" }}>
                            <ToolTipWrapper text="Button in bottom right corner">
                                <button style={{ padding: "10px 20px" }}>Corner</button>
                            </ToolTipWrapper>
                        </div>

                        <div style={{ position: "absolute", top: "60px", right: "20px" }}>
                            <ToolTipWrapper text="Button in top right corner">
                                <button style={{ padding: "10px 20px" }}>Top Corner</button>
                            </ToolTipWrapper>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        );
    },
};

/**
 * Multiple containers with separate tooltip systems
 */
export const MultipleContainers: Story = {
    render: () => (
        <div style={{ display: "flex", gap: "20px", padding: "20px", flexWrap: "wrap" }}>
            <TooltipProvider containerId="container-1" portalId="portal-1">
                <div
                    id="container-1"
                    style={{
                        width: "300px",
                        height: "250px",
                        border: "2px solid blue",
                        padding: "15px",
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#e3f2fd",
                    }}
                >
                    <h4 style={{ margin: "0 0 10px 0", color: "blue" }}>Container 1</h4>
                    <p style={{ margin: "0 0 15px 0", fontSize: "14px" }}>
                        Tooltip scoped to this container
                    </p>
                    <ToolTipWrapper text="Tooltip in blue container">
                        <button style={{ padding: "8px 16px" }}>Button 1</button>
                    </ToolTipWrapper>

                    <div style={{ position: "absolute", bottom: "15px", right: "15px" }}>
                        <ToolTipWrapper text="Bottom right of blue">
                            <button style={{ padding: "8px 16px" }}>Corner 1</button>
                        </ToolTipWrapper>
                    </div>
                </div>
            </TooltipProvider>

            <TooltipProvider containerId="container-2" portalId="portal-2">
                <div
                    id="container-2"
                    style={{
                        width: "300px",
                        height: "250px",
                        border: "2px solid green",
                        padding: "15px",
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#e8f5e9",
                    }}
                >
                    <h4 style={{ margin: "0 0 10px 0", color: "green" }}>Container 2</h4>
                    <p style={{ margin: "0 0 15px 0", fontSize: "14px" }}>
                        Independent tooltip system
                    </p>
                    <ToolTipWrapper text={["Green container", "Independent system", "Multiple lines"]}>
                        <button style={{ padding: "8px 16px" }}>Button 2</button>
                    </ToolTipWrapper>

                    <div style={{ position: "absolute", bottom: "15px", right: "15px" }}>
                        <ToolTipWrapper text="Bottom right of green">
                            <button style={{ padding: "8px 16px" }}>Corner 2</button>
                        </ToolTipWrapper>
                    </div>
                </div>
            </TooltipProvider>

            <TooltipProvider containerId="container-3" portalId="portal-3">
                <div
                    id="container-3"
                    style={{
                        width: "300px",
                        height: "250px",
                        border: "2px solid orange",
                        padding: "15px",
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#fff3e0",
                    }}
                >
                    <h4 style={{ margin: "0 0 10px 0", color: "orange" }}>Container 3</h4>
                    <p style={{ margin: "0 0 15px 0", fontSize: "14px" }}>
                        Third independent system
                    </p>
                    <ToolTipWrapper text="Orange container tooltip">
                        <button style={{ padding: "8px 16px" }}>Button 3</button>
                    </ToolTipWrapper>

                    <div style={{ position: "absolute", bottom: "15px", right: "15px" }}>
                        <ToolTipWrapper text="Bottom right of orange">
                            <button style={{ padding: "8px 16px" }}>Corner 3</button>
                        </ToolTipWrapper>
                    </div>
                </div>
            </TooltipProvider>
        </div>
    ),
};

/**
 * Window resize behavior test
 */
export const WindowResize: Story = {
    render: () => (
        <>
            <div style={{ padding: "20px" }}>
                <h3 style={{ margin: "0 0 10px 0" }}>Window Resize Test</h3>
                <p style={{ margin: "0 0 30px 0" }}>
                    Resize browser window while hovering over buttons
                </p>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "50px",
                    }}
                >
                    <ToolTipWrapper text="Tooltip on left - adjusts during window resize">
                        <button style={{ padding: "10px 20px" }}>Left side</button>
                    </ToolTipWrapper>

                    <ToolTipWrapper text="Tooltip on right - adjusts during window resize">
                        <button style={{ padding: "10px 20px" }}>Right side</button>
                    </ToolTipWrapper>
                </div>

                <div
                    style={{
                        position: "fixed",
                        bottom: "50px",
                        right: "50px",
                    }}
                >
                    <ToolTipWrapper text="Fixed position - tooltip adjusts to window size">
                        <button style={{ padding: "10px 20px" }}>Fixed Button</button>
                    </ToolTipWrapper>
                </div>

                <div
                    style={{
                        position: "fixed",
                        bottom: "50px",
                        left: "50px",
                    }}
                >
                    <ToolTipWrapper text="Fixed bottom left">
                        <button style={{ padding: "10px 20px" }}>Fixed Left</button>
                    </ToolTipWrapper>
                </div>

                <div
                    style={{
                        position: "fixed",
                        top: "100px",
                        right: "50px",
                    }}
                >
                    <ToolTipWrapper text="Fixed top right">
                        <button style={{ padding: "10px 20px" }}>Fixed Top</button>
                    </ToolTipWrapper>
                </div>
            </div>
        </>
    ),
};

/**
 * Long content tooltip
 */
export const LongContent: Story = {
    render: () => (
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <ToolTipWrapper text="This is a very long tooltip text that should wrap properly within the max-width constraint of 300px. It demonstrates how the tooltip handles longer content.">
                <button style={{ padding: "10px 20px" }}>Long text tooltip</button>
            </ToolTipWrapper>

            <ToolTipWrapper
                text={[
                    "First item in a long list",
                    "Second item with more text",
                    "Third item",
                    "Fourth item with even more text to show wrapping",
                    "Fifth item",
                    "Sixth item",
                    "Seventh item",
                    "Eighth item - very long list!",
                ]}
            >
                <button style={{ padding: "10px 20px" }}>Long list tooltip</button>
            </ToolTipWrapper>

            <ToolTipWrapper
                text={
                    <div style={{ maxWidth: "250px" }}>
                        <h4 style={{ margin: "0 0 8px 0" }}>Custom Long Content</h4>
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px" }}>
                            This is a custom tooltip with a lot of content. It includes multiple paragraphs and
                            demonstrates how custom React nodes work.
                        </p>
                        <p style={{ margin: "0", fontSize: "12px", color: "#ccc" }}>
                            Even more text in a second paragraph with different styling.
                        </p>
                    </div>
                }
            >
                <button style={{ padding: "10px 20px" }}>Custom long content</button>
            </ToolTipWrapper>
        </div>
    ),
};
