import { validateEasyBrokerConfig } from '@/1-app-global-core/config';
import { EasyBrokerServiceAPI } from '@/1-app-global-core/services/easybroker.service';
import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /api/easybroker/properties/[publicId]/sheet
 * Genera y descarga la ficha técnica de una propiedad de Easy Broker
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    if (!validateEasyBrokerConfig()) {
      return new Response(
        JSON.stringify({
          error: 'Easy Broker API no configurada',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const publicId = params.publicId;

    if (!publicId) {
      return new Response(
        JSON.stringify({
          error: 'publicId es requerido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obtener propiedad - usar fetch directo para evitar problemas de validación
    let property: any;

    try {
      const apiKey =
        import.meta.env.EASYBROKER_API_KEY ||
        import.meta.env.PUBLIC_EASYBROKER_API_KEY ||
        '';
      const easyBrokerResponse = await fetch(
        `https://api.easybroker.com/v1/properties/${publicId}`,
        {
          headers: {
            'X-Authorization': apiKey,
            Accept: 'application/json',
          },
        }
      );

      if (!easyBrokerResponse.ok) {
        throw new Error(`Easy Broker API error: ${easyBrokerResponse.status}`);
      }

      const easyBrokerData = await easyBrokerResponse.json();
      property = easyBrokerData.property || easyBrokerData;
    } catch (fetchError) {
      console.error(
        '❌ Error al obtener propiedad de Easy Broker:',
        fetchError
      );
      // Si falla, intentar con el servicio
      const result = await EasyBrokerServiceAPI.getProperty(publicId);
      if (result.error || !result.data) {
        return new Response(
          JSON.stringify({
            error: result.error?.message || 'Propiedad no encontrada',
          }),
          {
            status: result.error?.status || 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      property = result.data;
    }

    // Generar HTML de la ficha técnica
    const html = generatePropertySheetHTML(property);

    // Retornar HTML para descarga
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="ficha-${
          property.public_id || publicId
        }.html"`,
      },
    });
  } catch (error) {
    console.error('❌ Error al generar ficha:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Genera el HTML de la ficha técnica de la propiedad
 */
function generatePropertySheetHTML(property: any): string {
  const price = property.operations?.[0];
  const location = property.location;

  return `<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Ficha Técnica - ${property.title}</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 800px;
			margin: 0 auto;
			padding: 20px;
		}
		.header {
			border-bottom: 3px solid #2563eb;
			padding-bottom: 20px;
			margin-bottom: 30px;
		}
		.title {
			font-size: 28px;
			font-weight: bold;
			color: #1e293b;
			margin-bottom: 10px;
		}
		.price {
			font-size: 24px;
			color: #2563eb;
			font-weight: bold;
			margin: 15px 0;
		}
		.section {
			margin: 30px 0;
		}
		.section-title {
			font-size: 20px;
			font-weight: bold;
			color: #1e293b;
			border-bottom: 2px solid #e2e8f0;
			padding-bottom: 10px;
			margin-bottom: 15px;
		}
		.info-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 15px;
			margin: 20px 0;
		}
		.info-item {
			padding: 10px;
			background: #f8fafc;
			border-radius: 8px;
		}
		.info-label {
			font-weight: bold;
			color: #64748b;
			font-size: 14px;
			margin-bottom: 5px;
		}
		.info-value {
			color: #1e293b;
			font-size: 16px;
		}
		.description {
			background: #f8fafc;
			padding: 20px;
			border-radius: 8px;
			margin: 20px 0;
		}
		.image {
			max-width: 100%;
			height: auto;
			border-radius: 8px;
			margin: 20px 0;
		}
		@media print {
			body { padding: 0; }
			.section { page-break-inside: avoid; }
		}
	</style>
</head>
<body>
	<div class="header">
		<h1 class="title">${escapeHtml(property.title)}</h1>
		${
      price
        ? `<div class="price">${escapeHtml(price.formatted_amount)} ${
            price.currency || 'MXN'
          }</div>`
        : ''
    }
		<div class="info-value">
			📍 ${escapeHtml(formatLocation(location))}
		</div>
	</div>

	${
    property.title_image_full
      ? `<img src="${escapeHtml(property.title_image_full)}" alt="${escapeHtml(
          property.title
        )}" class="image">`
      : ''
  }

	<div class="section">
		<h2 class="section-title">Información General</h2>
		<div class="info-grid">
			<div class="info-item">
				<div class="info-label">Tipo de Propiedad</div>
				<div class="info-value">${escapeHtml(property.property_type)}</div>
			</div>
			<div class="info-item">
				<div class="info-label">Estado</div>
				<div class="info-value">${escapeHtml(property.status)}</div>
			</div>
			${
        property.features?.bedrooms
          ? `
			<div class="info-item">
				<div class="info-label">Recámaras</div>
				<div class="info-value">${property.features.bedrooms}</div>
			</div>
			`
          : ''
      }
			${
        property.features?.bathrooms
          ? `
			<div class="info-item">
				<div class="info-label">Baños</div>
				<div class="info-value">${property.features.bathrooms}</div>
			</div>
			`
          : ''
      }
			${
        property.features?.construction_size
          ? `
			<div class="info-item">
				<div class="info-label">Área de Construcción</div>
				<div class="info-value">${property.features.construction_size} m²</div>
			</div>
			`
          : ''
      }
			${
        property.features?.parking_spaces
          ? `
			<div class="info-item">
				<div class="info-label">Estacionamientos</div>
				<div class="info-value">${property.features.parking_spaces}</div>
			</div>
			`
          : ''
      }
		</div>
	</div>

	${
    property.description
      ? `
	<div class="section">
		<h2 class="section-title">Descripción</h2>
		<div class="description">
			${escapeHtml(property.description).replace(/\\n/g, '<br>')}
		</div>
	</div>
	`
      : ''
  }

	${
    property.tags && property.tags.length > 0
      ? `
	<div class="section">
		<h2 class="section-title">Características</h2>
		<div class="info-value">
			${property.tags
        .map(
          (tag: string) =>
            `<span style="display: inline-block; background: #e2e8f0; padding: 5px 10px; border-radius: 5px; margin: 5px;">${escapeHtml(
              tag
            )}</span>`
        )
        .join('')}
		</div>
	</div>
	`
      : ''
  }

	<div class="section">
		<h2 class="section-title">Ubicación</h2>
		<div class="info-value">
			<p><strong>País:</strong> ${escapeHtml(location?.country || 'N/A')}</p>
			<p><strong>Estado:</strong> ${escapeHtml(location?.state || 'N/A')}</p>
			<p><strong>Ciudad:</strong> ${escapeHtml(location?.city || 'N/A')}</p>
			${
        location?.neighborhood
          ? `<p><strong>Colonia:</strong> ${escapeHtml(
              location.neighborhood
            )}</p>`
          : ''
      }
			${
        location?.address
          ? `<p><strong>Dirección:</strong> ${escapeHtml(location.address)}</p>`
          : ''
      }
			${
        location?.postal_code
          ? `<p><strong>Código Postal:</strong> ${escapeHtml(
              location.postal_code
            )}</p>`
          : ''
      }
		</div>
	</div>

	<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
		<p>Ficha generada el ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</p>
		<p>ID de Propiedad: ${escapeHtml(property.public_id)}</p>
	</div>
</body>
</html>`;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatLocation(location: any): string {
  if (!location) return 'Ubicación no disponible';
  const parts: string[] = [];
  if (location.address) parts.push(location.address);
  if (location.neighborhood) parts.push(location.neighborhood);
  if (location.city) parts.push(location.city);
  if (location.state && location.state !== location.city)
    parts.push(location.state);
  return parts.length > 0 ? parts.join(', ') : 'Ubicación no disponible';
}
