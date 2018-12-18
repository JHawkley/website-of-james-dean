import ReactDOMServer from "react-dom/server";
import { Text } from '@vx/text';
import { dew, is } from "tools/common";
import { base64 } from "tools/strings";
import { extensions as numEx } from "tools/numbers";
import { extensions as strEx } from "tools/strings";
import { extensions as maybe } from "tools/maybe";

const { roundTo } = numEx;
const { min } = Math;
const px = "px";

export function generateSvgPlaceholder({width, height, style}) {
  const svgBody = ReactDOMServer.renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width+px} height={height+px}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
    />
  );

  return "data:image/svg+xml;base64," + base64.encode(svgBody);
}

export function generateSvg(coreDef, iconDef, textDefs = []) {
  const { width, height, fontImports = [], style: coreStyle } = coreDef;

  const iconSvg = iconDef::maybe.map(({icon: faIcon, style: iconStyle, size: iconSize = 0.5}) => {
    const [iconWidth, iconHeight, , ,path] = faIcon.icon;
    const size = (iconSize * min(width, height))::roundTo(2);
    const hSize = size * 0.5;
    const props =  {
      width: size+px, height: size+px,
      x: (((width * 0.5) - hSize)::roundTo(2))+px,
      y: (((height * 0.5) - hSize)::roundTo(2))+px
    };

    return (
      <svg
        preserveAspectRatio="xMinYMin meet"
        viewBox={`0 0 ${iconWidth} ${iconHeight}`}
        style={iconStyle}
        {...props}
      >
        <path d={path} />
      </svg>
    );
  });

  const textSvg = textDefs.map((textDef, i) => {
    const {
      text,
      padding = 0.0,
      size: textSize = 0.1,
      position,
      props: {style: textStyle, ...otherProps} = {}
    } = textDef;

    if (text::strEx.isNullishOrEmpty()) return void 0;

    const sizingBasis = min(width, height);
    const buffer = (padding * sizingBasis)::roundTo(0);
    const size = (textSize * sizingBasis)::roundTo(0);

    const textWidth = width - buffer - buffer;
    const textHeight = height - buffer - buffer;

    const [x, y]
      = position::is.function()
      ? position(textWidth, textHeight, size)
      : dew(() => {
        const [scalarX = 0.0, scalarY = 0.0] = position ?? [];
        return [scalarX * textWidth, scalarY * textHeight];
      });
    
    const newStyle = { ...textStyle, fontSize: size+px };
    return (
      <g key={i} transform={`translate(${buffer},${buffer})`}>
        <Text {...otherProps} width={textWidth} x={x::roundTo(0)} y={y::roundTo(0)} style={newStyle}>
          {text}
        </Text>
      </g>
    );
  });

  const svgBody = ReactDOMServer.renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width+px} height={height+px}
      viewBox={`0 0 ${width} ${height}`}
      style={coreStyle}
    >
      {textSvg.length > 0 && fontImports.length > 0 && (
        <defs>
          <style type="text/css">
            {fontImports.map(url => `@import url(${url});`).join("")}
          </style>
        </defs>
      )}
      {iconSvg}
      {textSvg}
    </svg>
  );

  return "data:image/svg+xml;base64," + base64.encode(svgBody);
}