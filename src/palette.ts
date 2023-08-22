import { MarkdownRenderChild, Notice } from "obsidian";
import colorsea from 'colorsea';
import ColorPalette, { urlRegex } from "./main";
import { ColorPaletteSettings } from "./settings";

export class Palette extends MarkdownRenderChild {
    plugin: ColorPalette;
    settings: ColorPaletteSettings;
	input: string;
    names: string[];
	colors: string[];

	constructor(plugin: ColorPalette, settings: ColorPaletteSettings, containerEl: HTMLElement, input: string) {
      super(containerEl);
      this.plugin = plugin;
      this.settings = settings;
      this.input = input;
      this.names = [];
      this.colors = [];
	}
  
	onload() {

        // Check if link
        if (this.input.match(urlRegex)) {
            
            // contains colors= (realtimecolors)
            if (this.input.contains("colors="))
                this.colors = this.input.substring(this.input.lastIndexOf('colors=') + 7).split('-').map(i => '#' + i)
            
                // contains dashes (coolor url)
            else if (this.input.contains('-'))
                this.colors = this.input.substring(this.input.lastIndexOf('/') + 1).split('-').map(i => '#' + i)
            
            // assume colorhunt
            else
                this.colors = this.input.substring(this.input.lastIndexOf('/') + 1).match(/.{1,6}/g)?.map(i => '#' + i) || ['Invalid Palette']

            this.names = this.colors;
        }
        else {
            if (this.input.contains(',\n') || this.input.contains('\n') || this.input.contains(','))
            {
                const matches = Array.from(this.input.matchAll(/([\w ]+)?(#(?:[0-9a-f]{6}|[0-9a-f]{3}))/ig));

                for (let i = 0; i < matches.length; i++) {
                    this.names.push(matches[i][1]);
                    this.colors.push(matches[i][2]);
                }
            }
            else {
                // Not matching
                this.colors[0] = 'Invalid Palette'
            }
        }

        // Add new palette to state
        if(this.colors[0] !== 'Invalid Palette'){
            this.plugin.palettes?.push(this);
        }

        this.createPalette();
	}

    unload() {
        // Remove palette from state
        if(this.colors[0] !== 'Invalid Palette'){
            this.plugin.palettes?.remove(this);
        }
    }

    public refresh(){
        this.containerEl.empty();
        this.createPalette()
    }
    
    public createPalette(){
        this.containerEl.addClass('palette')
        this.containerEl.toggleClass('paletteColumn', this.settings.paletteDirection === 'column');
        // set --palette-height css variable
        this.containerEl.style.setProperty('--palette-height', this.settings.paletteHeight.toString() + 'px')
        for (let i = 0; i < this.colors.length; i++) {
            const color = this.colors[i];
            const name = this.names[i];
            const csColor = colorsea(color);
            
            let child = this.containerEl.createEl('div');
            // set --palette-background-color css variable
            child.style.setProperty('--palette-background-color', color);
            // set --palette-column-flex-basis css variable
            child.style.setProperty('--palette-column-flex-basis', (this.settings.paletteHeight / this.colors.length / 2).toString() + 'px');

            const invalidPalette =  this.colors[0] === "Invalid Palette"

            if (name && name != color) {
                let childName = child.createEl('span', { text: name.trim() });
                childName.style.setProperty(
                    '--palette-color', 
                    (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff'
                )

                if (this.settings.paletteInformationHidden) 
                    childName.addClass("hidden");
            }
            
            let childText = child.createEl('span', { text: color.toUpperCase() });
            childText.toggleClass('invalid', invalidPalette);
            // set --palette-color css variable
            childText.style.setProperty(
                '--palette-color', 
                (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff'
            )

            if (this.settings.paletteInformationHidden) 
                childText.addClass("hidden");

            child.onClickEvent((e) => {
                if(invalidPalette) return;
                new Notice(`Copied ${color}`);
                navigator.clipboard.writeText(color)
            });
        }
    }
}