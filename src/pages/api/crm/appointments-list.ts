import {
  getEasyBrokerApiKey,
  getEasyBrokerBaseUrl,
  supabase,
} from '@/1-app-global-core/config';
import type { Appointment } from '@/1-app-global-core/types/appointment';
import type { APIRoute } from 'astro';

export const prerender = false; // Server-rendered

export const GET: APIRoute = async ({ url }) => {
  try {
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Intentar hacer JOIN con properties, pero si falla, usar solo appointments
    let query = supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .range(offset, offset + limit - 1);

    // Intentar hacer JOIN con properties si la relación existe
    try {
      query = supabase
        .from('appointments')
        .select(
          `
					*,
					properties (
						id,
						title,
						address,
						price,
						property_type,
						bedrooms,
						bathrooms,
						area,
						features
					)
				`
        )
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .range(offset, offset + limit - 1);
    } catch (e) {
      // Si falla, usar solo appointments
      query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .range(offset, offset + limit - 1);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      // Si el error es por la relación con properties, intentar sin JOIN
      if (
        error.message?.includes('relationship') ||
        error.message?.includes('properties')
      ) {
        console.warn(
          '⚠️ Relación con properties no encontrada, usando solo appointments:',
          error.message
        );
        const fallbackQuery = supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
          fallbackQuery.eq('status', status);
        }

        const { data: fallbackData, error: fallbackError } =
          await fallbackQuery;

        if (fallbackError) {
          return new Response(
            JSON.stringify({
              error: 'Error al obtener citas',
              details: fallbackError.message,
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Si hay property_id, intentar obtener la propiedad manualmente
        const appointmentsWithProperties = await Promise.all(
          (fallbackData || []).map(async (apt: any) => {
            if (apt.property_id) {
              try {
                const { data: propertyData } = await supabase
                  .from('properties')
                  .select(
                    'id, title, address, price, property_type, bedrooms, bathrooms, area, features'
                  )
                  .eq('id', apt.property_id)
                  .single();

                if (propertyData) {
                  // Intentar obtener imagen desde features (si se guardó) o buscar en Easy Broker
                  let imageUrl = null;
                  if (propertyData.features?.easybroker_public_id) {
                    // Es una propiedad de Easy Broker, buscar la imagen
                    try {
                      const apiKey = getEasyBrokerApiKey();
                      const baseUrl = getEasyBrokerBaseUrl();
                      if (apiKey && baseUrl) {
                        const easyBrokerRes = await fetch(
                          `${baseUrl}/properties/${propertyData.features.easybroker_public_id}`,
                          {
                            headers: {
                              'X-Authorization': apiKey,
                            },
                          }
                        );
                        if (easyBrokerRes.ok) {
                          const ebData = await easyBrokerRes.json();
                          imageUrl =
                            ebData.title_image_thumb ||
                            ebData.title_image_full ||
                            ebData.images?.[0]?.url ||
                            null;
                        }
                      }
                    } catch (e) {
                      // Ignorar errores al buscar en Easy Broker
                    }
                  }
                  apt.properties = {
                    ...propertyData,
                    imageUrl,
                  };
                  // También agregar imageUrl directamente al objeto property para compatibilidad
                  apt.property = {
                    id: propertyData.id,
                    title: propertyData.title,
                    address: propertyData.address,
                    price: propertyData.price,
                    propertyType: propertyData.property_type,
                    bedrooms: propertyData.bedrooms,
                    bathrooms: propertyData.bathrooms,
                    area: propertyData.area,
                    imageUrl,
                  };
                }
              } catch (e) {
                // Ignorar errores al obtener la propiedad
              }
            }
            // Si no hay property_id pero hay notas con información de Easy Broker, intentar extraer
            else if (apt.notes) {
              const easyBrokerIdMatch = apt.notes.match(
                /Easy Broker ID:\s*([^\s\n]+)/i
              );
              const imageMatch = apt.notes.match(/Imagen:\s*([^\s\n]+)/i);
              const propertyTitleMatch = apt.notes.match(
                /Propiedad:\s*([^\n]+)/i
              );
              const addressMatch = apt.notes.match(/Dirección:\s*([^\n]+)/i);

              // Si hay imagen en las notas, usarla directamente
              let imageUrl = imageMatch ? imageMatch[1].trim() : null;

              if (easyBrokerIdMatch) {
                try {
                  const apiKey = getEasyBrokerApiKey();
                  const baseUrl = getEasyBrokerBaseUrl();
                  if (apiKey && baseUrl) {
                    const easyBrokerRes = await fetch(
                      `${baseUrl}/properties/${easyBrokerIdMatch[1]}`,
                      {
                        headers: {
                          'X-Authorization': apiKey,
                        },
                      }
                    );
                    if (easyBrokerRes.ok) {
                      const ebData = await easyBrokerRes.json();
                      // Si no había imagen en las notas, obtenerla de la API
                      if (!imageUrl) {
                        imageUrl =
                          ebData.title_image_thumb ||
                          ebData.title_image_full ||
                          ebData.images?.[0]?.url ||
                          null;
                      }
                      apt.properties = {
                        id: easyBrokerIdMatch[1],
                        title:
                          ebData.title ||
                          propertyTitleMatch?.[1]?.trim() ||
                          'Propiedad de Easy Broker',
                        address:
                          typeof ebData.location === 'string'
                            ? ebData.location
                            : ebData.location?.address ||
                              addressMatch?.[1]?.trim() ||
                              '',
                        price: ebData.operations?.[0]?.amount || 0,
                        propertyType: ebData.property_type || 'casa',
                        bedrooms: ebData.features?.bedrooms || null,
                        bathrooms: ebData.features?.bathrooms || null,
                        area: ebData.features?.construction_size || null,
                        imageUrl: imageUrl,
                      };
                      // También agregar como property para compatibilidad con la tabla
                      apt.property = {
                        id: easyBrokerIdMatch[1],
                        title:
                          ebData.title ||
                          propertyTitleMatch?.[1]?.trim() ||
                          'Propiedad de Easy Broker',
                        address:
                          typeof ebData.location === 'string'
                            ? ebData.location
                            : ebData.location?.address ||
                              addressMatch?.[1]?.trim() ||
                              '',
                        price: ebData.operations?.[0]?.amount || 0,
                        propertyType: ebData.property_type || 'casa',
                        bedrooms: ebData.features?.bedrooms || null,
                        bathrooms: ebData.features?.bathrooms || null,
                        area: ebData.features?.construction_size || null,
                        imageUrl: imageUrl,
                      };
                    }
                  }
                } catch (e) {
                  // Si falla la API pero tenemos información en notas, crear objeto básico
                  if (imageUrl || propertyTitleMatch) {
                    apt.properties = {
                      id: easyBrokerIdMatch[1],
                      title: propertyTitleMatch
                        ? propertyTitleMatch[1].trim()
                        : 'Propiedad de Easy Broker',
                      address: addressMatch ? addressMatch[1].trim() : '',
                      price: 0,
                      propertyType: 'casa',
                      bedrooms: null,
                      bathrooms: null,
                      area: null,
                      imageUrl: imageUrl,
                    };
                    // También agregar como property para compatibilidad
                    apt.property = {
                      id: easyBrokerIdMatch[1],
                      title: propertyTitleMatch
                        ? propertyTitleMatch[1].trim()
                        : 'Propiedad de Easy Broker',
                      address: addressMatch ? addressMatch[1].trim() : '',
                      price: 0,
                      propertyType: 'casa',
                      bedrooms: null,
                      bathrooms: null,
                      area: null,
                      imageUrl: imageUrl,
                    };
                  }
                }
              } else if (imageUrl || propertyTitleMatch) {
                // Si solo hay imagen o título pero no ID, crear objeto básico desde las notas
                apt.properties = {
                  id: 'unknown',
                  title: propertyTitleMatch
                    ? propertyTitleMatch[1].trim()
                    : 'Propiedad',
                  address: addressMatch ? addressMatch[1].trim() : '',
                  price: 0,
                  propertyType: 'casa',
                  bedrooms: null,
                  bathrooms: null,
                  area: null,
                  imageUrl: imageUrl,
                };
                // También agregar como property para compatibilidad
                apt.property = {
                  id: 'unknown',
                  title: propertyTitleMatch
                    ? propertyTitleMatch[1].trim()
                    : 'Propiedad',
                  address: addressMatch ? addressMatch[1].trim() : '',
                  price: 0,
                  propertyType: 'casa',
                  bedrooms: null,
                  bathrooms: null,
                  area: null,
                  imageUrl: imageUrl,
                };
              }
            }
            return apt;
          })
        );

        const formattedAppointments = appointmentsWithProperties.map(
          (apt: any) => {
            // Si no hay properties pero hay notas, intentar extraer información
            if (!apt.properties && apt.notes) {
              const imageMatch = apt.notes.match(/Imagen:\s*([^\s\n]+)/i);
              const propertyTitleMatch = apt.notes.match(
                /Propiedad:\s*([^\n]+)/i
              );
              const addressMatch = apt.notes.match(/Dirección:\s*([^\n]+)/i);

              if (imageMatch || propertyTitleMatch) {
                apt.properties = {
                  id: 'unknown',
                  title: propertyTitleMatch
                    ? propertyTitleMatch[1].trim()
                    : 'Propiedad',
                  address: addressMatch ? addressMatch[1].trim() : '',
                  price: 0,
                  propertyType: 'casa',
                  bedrooms: null,
                  bathrooms: null,
                  area: null,
                  imageUrl: imageMatch ? imageMatch[1].trim() : null,
                };
              }
            }

            return {
              id: apt.id,
              clientName: apt.client_name,
              clientEmail: apt.client_email,
              clientPhone: apt.client_phone,
              propertyId: apt.property_id || null,
              property: apt.properties
                ? {
                    id: apt.properties.id,
                    title: apt.properties.title,
                    address: apt.properties.address,
                    price: apt.properties.price,
                    propertyType: apt.properties.property_type,
                    bedrooms: apt.properties.bedrooms,
                    bathrooms: apt.properties.bathrooms,
                    area: apt.properties.area,
                    imageUrl: apt.properties.imageUrl || null,
                  }
                : apt.resource_details?.property || null,
              date: apt.appointment_date,
              time: apt.appointment_time,
              status: apt.status,
              notes: apt.notes,
              operationType: apt.operation_type,
              budgetRange: apt.budget_range,
              createdAt: apt.created_at,
            };
          }
        );

        return new Response(JSON.stringify(formattedAppointments), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          error: 'Error al obtener citas',
          details: error.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const appointments = (data || []) as Appointment[];

    // Formatear datos para el frontend y obtener imágenes si es necesario
    const formattedAppointments = await Promise.all(
      appointments.map(async (apt: any) => {
        let imageUrl = null;

        // Si hay propiedad relacionada, intentar obtener la imagen
        if (apt.properties) {
          // Si tiene features con easybroker_public_id, buscar la imagen
          if (apt.properties.features?.easybroker_public_id) {
            try {
              const apiKey = getEasyBrokerApiKey();
              const baseUrl = getEasyBrokerBaseUrl();
              if (apiKey && baseUrl) {
                const easyBrokerRes = await fetch(
                  `${baseUrl}/properties/${apt.properties.features.easybroker_public_id}`,
                  {
                    headers: {
                      'X-Authorization': apiKey,
                    },
                  }
                );
                if (easyBrokerRes.ok) {
                  const ebData = await easyBrokerRes.json();
                  imageUrl =
                    ebData.title_image_thumb ||
                    ebData.title_image_full ||
                    ebData.images?.[0]?.url ||
                    null;
                }
              }
            } catch (e) {
              // Ignorar errores
            }
          }
        }

        // Si no hay property pero hay notas, intentar extraer imagen
        if (!imageUrl && apt.notes) {
          const imageMatch = apt.notes.match(/Imagen:\s*([^\s\n]+)/i);
          if (imageMatch) {
            imageUrl = imageMatch[1].trim();
          }
        }

        // Si hay property pero no imageUrl, intentar desde notas
        if (
          apt.properties &&
          !apt.properties.imageUrl &&
          !imageUrl &&
          apt.notes
        ) {
          const imageMatch = apt.notes.match(/Imagen:\s*([^\s\n]+)/i);
          if (imageMatch) {
            imageUrl = imageMatch[1].trim();
          }
        }

        return {
          id: apt.id,
          clientName: apt.client_name,
          clientEmail: apt.client_email,
          clientPhone: apt.client_phone,
          propertyId: apt.property_id || null,
          property: apt.properties
            ? {
                id: apt.properties.id,
                title: apt.properties.title,
                address: apt.properties.address,
                price: apt.properties.price,
                propertyType: apt.properties.property_type,
                bedrooms: apt.properties.bedrooms,
                bathrooms: apt.properties.bathrooms,
                area: apt.properties.area,
                imageUrl: imageUrl || apt.properties.imageUrl || null,
              }
            : apt.resource_details?.property || null,
          date: apt.appointment_date,
          time: apt.appointment_time,
          status: apt.status,
          notes: apt.notes,
          operationType: apt.operation_type,
          budgetRange: apt.budget_range,
          createdAt: apt.created_at,
        };
      })
    );

    return new Response(JSON.stringify(formattedAppointments), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
