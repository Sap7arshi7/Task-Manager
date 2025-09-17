import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttmjpcislsrgfuqvuheq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0bWpwY2lzbHNyZ2Z1cXZ1aGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTEzODUsImV4cCI6MjA3MTM4NzM4NX0.DX8ymYEZ8RJQ0huHquDu9lFYB6-I98mpapPxF0lPA4o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
