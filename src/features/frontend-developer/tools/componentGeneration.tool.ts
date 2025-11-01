import type { DesignArtifact } from "../../designer/types";
import type { FrontendArtifact, FrontendTask } from "../types";

export async function componentGenerationTool(
  task: FrontendTask
): Promise<FrontendArtifact> {
  const designSpec = task.designSpec as DesignArtifact | undefined;
  const components: FrontendArtifact["components"] = [];
  const stylesheets: FrontendArtifact["stylesheets"] = [];

  // Generate components from design spec
  if (designSpec && designSpec.components) {
    for (const designComponent of designSpec.components) {
      const componentCode = generateReactComponent(designComponent, designSpec);
      components.push(componentCode);

      // Generate stylesheets if color palette is provided
      if (designSpec.colorPalette) {
        const styles = generateStylesheet(designComponent, designSpec);
        stylesheets.push(styles);
      }
    }
  } else {
    // Fallback: generate component from requirements
    const componentCode = generateComponentFromRequirements(task.requirements);
    components.push(componentCode);
  }

  return {
    id: generateArtifactId(task.id),
    workflowTaskId: task.id,
    components,
    stylesheets,
    tests: [],
    metadata: {
      workflowId: task.workflowId,
      agentType: "FrontendDeveloper",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function generateReactComponent(
  designComponent: DesignArtifact["components"][0],
  designSpec: DesignArtifact
): FrontendArtifact["components"][0] {
  const componentName = designComponent.componentName;
  const propsInterface = generatePropsInterface(designComponent);
  const componentCode = generateComponentJSX(designComponent, designSpec);
  const propsParams = generatePropsParams(designComponent);

  return {
    id: `component-${componentName.toLowerCase()}`,
    componentName,
    filePath: `src/components/${componentName}.tsx`,
    code: `import React from 'react';

${propsInterface}

export const ${componentName}: React.FC<${componentName}Props> = ({${propsParams ? `\n  ${propsParams}\n` : " children"} }) => {
${componentCode}
};

export default ${componentName};`,
    language: "tsx",
    imports: [
      {
        module: "react",
        named: ["React"],
      },
    ],
    exports: [
      {
        type: "named",
        name: componentName,
      },
      {
        type: "default",
        name: componentName,
      },
    ],
    dependencies: [],
    metadata: {
      workflowId: designSpec.metadata.workflowId,
      agentType: "FrontendDeveloper",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function generatePropsInterface(
  designComponent: DesignArtifact["components"][0]
): string {
  const props = designComponent.props
    .map((prop) => {
      const optional = prop.required ? "" : "?";
      const type = prop.type === "ReactNode" ? "React.ReactNode" : prop.type;
      return `  ${prop.name}${optional}: ${type}${prop.description ? `; // ${prop.description}` : ";"}`;
    })
    .join("\n");

  if (props.length === 0) {
    return `interface ${designComponent.componentName}Props {
  children?: React.ReactNode;
}`;
  }

  return `interface ${designComponent.componentName}Props {
${props}
}`;
}

function generatePropsParams(
  designComponent: DesignArtifact["components"][0]
): string {
  return (
    designComponent.props.map((prop) => `  ${prop.name}`).join(",\n") || ""
  );
}

function generateComponentJSX(
  designComponent: DesignArtifact["components"][0],
  designSpec: DesignArtifact
): string {
  const componentName = designComponent.componentName;
  let jsx = "";

  if (designComponent.category === "form") {
    const props = designComponent.props
      .map((p) => p.name)
      .filter((n) => n !== "label");
    jsx = `  return (
    <div className="${componentName.toLowerCase()}-container">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        type={type || 'text'}
        id={name}
        className="${componentName.toLowerCase()}-input"
        placeholder={placeholder}
        required={required}
        {...restProps}
      />
    </div>
  );`;
  } else if (
    designComponent.category === "feedback" ||
    componentName.toLowerCase().includes("button")
  ) {
    const variant =
      designComponent.variants && designComponent.variants.length > 0
        ? designComponent.variants[0].name
        : "primary";
    jsx = `  return (
    <button
      className={\`${componentName.toLowerCase()}-btn ${componentName.toLowerCase()}-btn-\${variant || '${variant}'}\`}
      disabled={disabled}
      {...restProps}
    >
      {children}
    </button>
  );`;
  } else if (
    designComponent.category === "display" ||
    componentName.toLowerCase().includes("card")
  ) {
    jsx = `  return (
    <div className="${componentName.toLowerCase()}-card">
      {children}
    </div>
  );`;
  } else {
    jsx = `  return (
    <div className="${componentName.toLowerCase()}">
      {children}
    </div>
  );`;
  }

  return jsx;
}

function generateStylesheet(
  designComponent: DesignArtifact["components"][0],
  designSpec: DesignArtifact
): FrontendArtifact["stylesheets"][0] {
  const componentName = designComponent.componentName.toLowerCase();
  const colorPalette = designSpec.colorPalette!;

  let content = `.${componentName} {\n`;

  if (
    designComponent.category === "feedback" ||
    componentName.includes("button")
  ) {
    content += "  display: inline-flex;\n";
    content += "  align-items: center;\n";
    content += "  justify-content: center;\n";
    content += "  padding: 0.5rem 1rem;\n";
    content += "  font-size: 1rem;\n";
    content += "  font-weight: 500;\n";
    content += "  border-radius: 0.375rem;\n";
    content += "  transition: all 0.2s;\n";
    content += "  cursor: pointer;\n";
    content += "  border: none;\n";
    content += `  background-color: ${colorPalette.primary};\n`;
    content += `  color: ${colorPalette.background};\n`;
    content += "}\n\n";

    content += `.${componentName}:hover {\n`;
    content += `  background-color: ${colorPalette.secondary};\n`;
    content += "}\n\n";

    content += `.${componentName}:disabled {\n`;
    content += "  opacity: 0.5;\n";
    content += "  cursor: not-allowed;\n";
    content += "}\n";
  } else if (designComponent.category === "form") {
    content += "  display: flex;\n";
    content += "  flex-direction: column;\n";
    content += "  gap: 0.5rem;\n";
    content += "}\n\n";

    content += `.${componentName}-input {\n`;
    content += "  padding: 0.5rem;\n";
    content += `  border: 1px solid ${colorPalette.neutral};\n`;
    content += "  border-radius: 0.25rem;\n";
    content += "  font-size: 1rem;\n";
    content += "}\n";
  } else {
    content += "  padding: 1rem;\n";
    content += `  background-color: ${colorPalette.background};\n`;
    content += `  color: ${colorPalette.text};\n`;
    content += "}\n";
  }

  return {
    id: `styles-${componentName}`,
    type: "css",
    content,
  };
}

function generateComponentFromRequirements(
  requirements: string
): FrontendArtifact["components"][0] {
  const componentName = extractComponentName(requirements);

  return {
    id: `component-${componentName.toLowerCase()}`,
    componentName,
    filePath: `src/components/${componentName}.tsx`,
    code: `import React from 'react';

interface ${componentName}Props {
  children?: React.ReactNode;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ children }) => {
  return (
    <div className="${componentName.toLowerCase()}">
      {children}
    </div>
  );
};

export default ${componentName};`,
    language: "tsx",
    imports: [
      {
        module: "react",
        named: ["React"],
      },
    ],
    exports: [
      {
        type: "named",
        name: componentName,
      },
      {
        type: "default",
        name: componentName,
      },
    ],
    dependencies: [],
    metadata: {
      workflowId: "",
      agentType: "FrontendDeveloper",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function extractComponentName(requirements: string): string {
  const lowerReq = requirements.toLowerCase();

  if (lowerReq.includes("button")) return "Button";
  if (lowerReq.includes("input") || lowerReq.includes("form field"))
    return "Input";
  if (lowerReq.includes("card")) return "Card";
  if (lowerReq.includes("navigation") || lowerReq.includes("nav"))
    return "Navigation";
  if (lowerReq.includes("sidebar")) return "Sidebar";
  if (lowerReq.includes("container")) return "Container";

  return "Component";
}

function generateArtifactId(taskId: string): string {
  return `frontend-artifact-${taskId}`;
}
