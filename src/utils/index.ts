
const whatsappNumber = 5516991790291
const email = `studio.torroja@gmail.com`
const instagram = `https://www.instagram.com/studio.torroja/`



const mapsLink = "https://www.google.com/maps/place/Av.+Prof.+Othon+Gama+D'E%C3%A7a,+677+-+Centro,+Florian%C3%B3polis+-+SC,+88015-240/@-27.589685,-48.5521411,986m/data=!3m2!1e3!4b1!4m6!3m5!1s0x95273818ef44cf45:0x820c90460fe96ac6!8m2!3d-27.589685!4d-48.5521411!16s%2Fg%2F11c51w2ntx?entry=ttu&g_ep=EgoyMDI1MDMxMi4wIKXMDSoJLDEwMjExNDUzSAFQAw%3D%3D"
export function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD") // Normaliza a string, separando letras e acentos
        .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
        .replace(/\s+/g, '-')           // Substitui espaços por hífens
        .replace(/[^\w\-]+/g, '')       // Remove caracteres não alfanuméricos, exceto hífen
        .replace(/\-\-+/g, '-')         // Substitui múltiplos hífens por um único hífen
        .replace(/^-+/, '')             // Remove hífens do início
        .replace(/-+$/, '');            // Remove hífens do final
}


const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.warn(`Elemento com ID "${id}" não encontrado.`);
    }
};

const whatsappLink = (path?: string) => {

    return `https://wa.me/${whatsappNumber}?text=Ol%C3%A1%2C%20acessei%20o%20site%20do%20Studio%20Torroja%20e%20gostaria%20de%20um%20or%C3%A7amento%21`
}

const instagramLink = (path?: string) => {

    return `${email}`
}

const mailLink = (path?: string) => {

    return `mailto:${email}`
}


export { scrollToSection, whatsappLink, whatsappNumber, mapsLink, instagramLink, mailLink }