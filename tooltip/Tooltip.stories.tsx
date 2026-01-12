import type { Meta, StoryObj } from "@storybook/react";
import TooltipCore from "./TooltipCore";
import ToolTipWrapper from "./ToolTipWrapper";
import { Provider } from "jotai";
import React from "react";

const meta = {
    title: "Components/Tooltip",
    component: TooltipCore,
    decorators: [
        (Story) => (
            <Provider>
                <div style={{ padding: "100px", minHeight: "400px" }}>
                    <Story />
                </div>
            </Provider>
        ),
    ],
    parameters: {
        layout: "fullscreen",
    },
} satisfies Meta<typeof TooltipCore>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleText: Story = {
    render: () => (
        <>
            <ToolTipWrapper text="To jest prosty tooltip">
                <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                    Najedź na mnie (prosty tekst)
                </button>
            </ToolTipWrapper>
            <TooltipCore />
        </>
    ),
};

export const WithDelay: Story = {
    render: () => (
        <>
            <ToolTipWrapper text="Tooltip z opóźnieniem 500ms" delay={500}>
                <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                    Najedź na mnie (z opóźnieniem)
                </button>
            </ToolTipWrapper>
            <TooltipCore />
        </>
    ),
};

export const ListTooltip: Story = {
    render: () => (
        <>
            <ToolTipWrapper text={["Pierwsza opcja", "Druga opcja", "Trzecia opcja"]}>
                <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                    Najedź na mnie (lista)
                </button>
            </ToolTipWrapper>
            <TooltipCore />
        </>
    ),
};

export const CustomContent: Story = {
    render: () => (
        <>
            <ToolTipWrapper
                text={
                    <div style={{ padding: "5px" }}>
                        <strong>Custom Content</strong>
                        <p style={{ margin: "5px 0" }}>To jest niestandardowa zawartość</p>
                        <small>z różnymi elementami HTML</small>
                    </div>
                }
            >
                <button style={{ padding: "10px 20px", cursor: "pointer" }}>
                    Najedź na mnie (custom)
                </button>
            </ToolTipWrapper>
            <TooltipCore />
        </>
    ),
};

export const LinkWithTooltip: Story = {
    render: () => (
        <>
            <ToolTipWrapper text="Kliknij aby przejść do strony" href="https://example.com">
                <a
                    href="https://example.com"
                    style={{
                        padding: "10px 20px",
                        textDecoration: "none",
                        color: "blue",
                        border: "1px solid blue",
                        display: "inline-block",
                    }}
                >
                    Link z tooltipem
                </a>
            </ToolTipWrapper>
            <TooltipCore />
        </>
    ),
};

export const KeyboardAccessible: Story = {
    render: () => (
        <>
            <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
                <ToolTipWrapper text="Użyj Tab aby przejść tutaj">
                    <button style={{ padding: "10px 20px" }}>Przycisk 1 (Tab)</button>
                </ToolTipWrapper>

                <ToolTipWrapper text="Tooltip pokazuje się również na focus">
                    <button style={{ padding: "10px 20px" }}>Przycisk 2 (Tab)</button>
                </ToolTipWrapper>

                <ToolTipWrapper text="Dostępność dla klawiatury">
                    <button style={{ padding: "10px 20px" }}>Przycisk 3 (Tab)</button>
                </ToolTipWrapper>
            </div>
            <TooltipCore />
        </>
    ),
};

export const MultipleElements: Story = {
    render: () => (
        <>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <ToolTipWrapper text="Tooltip dla przycisku">
                    <button style={{ padding: "10px 20px" }}>Przycisk</button>
                </ToolTipWrapper>

                <ToolTipWrapper text={["Opcja 1", "Opcja 2", "Opcja 3"]}>
                    <div
                        style={{
                            padding: "10px 20px",
                            border: "1px solid gray",
                            cursor: "pointer",
                        }}
                    >
                        Div z listą
                    </div>
                </ToolTipWrapper>

                <ToolTipWrapper text="Tooltip dla spana" as="span">
          <span
              style={{
                  padding: "5px 10px",
                  backgroundColor: "#f0f0f0",
                  cursor: "pointer",
              }}
          >
            Span element
          </span>
                </ToolTipWrapper>
            </div>
            <TooltipCore />
        </>
    ),
};

export const EdgeBehavior: Story = {
    render: () => (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "20px",
                }}
            >
                <ToolTipWrapper text="Tooltip po lewej stronie ekranu">
                    <button style={{ padding: "10px 20px" }}>Lewa strona</button>
                </ToolTipWrapper>

                <ToolTipWrapper text="Tooltip po prawej stronie ekranu">
                    <button style={{ padding: "10px 20px" }}>Prawa strona</button>
                </ToolTipWrapper>
            </div>
            <TooltipCore />
        </>
    ),
};
export const AllEdgesBehavior: Story = {
    render: () => (
        <>
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
                {/* Górny lewy róg */}
                <ToolTipWrapper text="Górny lewy róg - tooltip powinien być na dole i po prawej">
                    <button style={{ padding: "10px 20px" }}>Góra Lewo</button>
                </ToolTipWrapper>

                {/* Górny środek */}
                <ToolTipWrapper text="Górny środek - tooltip powinien być na dole">
                    <button style={{ padding: "10px 20px" }}>Góra Środek</button>
                </ToolTipWrapper>

                {/* Górny prawy róg */}
                <ToolTipWrapper text="Górny prawy róg - tooltip powinien być na dole i po lewej">
                    <button style={{ padding: "10px 20px" }}>Góra Prawo</button>
                </ToolTipWrapper>

                {/* Środkowy lewy */}
                <ToolTipWrapper text="Środek lewy - tooltip po prawej">
                    <button style={{ padding: "10px 20px" }}>Środek Lewo</button>
                </ToolTipWrapper>

                {/* Centrum */}
                <ToolTipWrapper text="Centrum - tooltip domyślnie">
                    <button style={{ padding: "10px 20px" }}>Centrum</button>
                </ToolTipWrapper>

                {/* Środkowy prawy */}
                <ToolTipWrapper text="Środek prawy - tooltip po lewej">
                    <button style={{ padding: "10px 20px" }}>Środek Prawo</button>
                </ToolTipWrapper>

                {/* Dolny lewy róg */}
                <ToolTipWrapper text="Dolny lewy róg - tooltip powinien być na górze i po prawej">
                    <button style={{ padding: "10px 20px" }}>Dół Lewo</button>
                </ToolTipWrapper>

                {/* Dolny środek */}
                <ToolTipWrapper text="Dolny środek - tooltip powinien być na górze">
                    <button style={{ padding: "10px 20px" }}>Dół Środek</button>
                </ToolTipWrapper>

                {/* Dolny prawy róg */}
                <ToolTipWrapper text="Dolny prawy róg - tooltip powinien być na górze i po lewej">
                    <button style={{ padding: "10px 20px" }}>Dół Prawo</button>
                </ToolTipWrapper>
            </div>
            <TooltipCore />
        </>
    ),
};
