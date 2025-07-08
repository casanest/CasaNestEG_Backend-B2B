
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Textarea, Select, toast } from "@medusajs/ui"
import { Plus, Trash, Globe, Save, AlertCircle, Package } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import React from "react"
import { 
  DetailWidgetProps, 
  AdminProductVariant,
} from "@medusajs/framework/types"

// Common language options for localization
const COMMON_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'tr', label: 'Turkish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'da', label: 'Danish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'pl', label: 'Polish' },
  { value: 'cs', label: 'Czech' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'ro', label: 'Romanian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'hr', label: 'Croatian' },
  { value: 'sk', label: 'Slovak' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'et', label: 'Estonian' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'mt', label: 'Maltese' },
  { value: 'ga', label: 'Irish' },
  { value: 'cy', label: 'Welsh' },
]

// Types for variant localization data
interface VariantLocalizationData {
  title: string
  description?: string
  material?: string
  color?: string
  size?: string
  style?: string
  notes?: string
}

interface VariantLocalizationMap {
  [languageCode: string]: VariantLocalizationData
}

interface VariantUpdateResponse {
  variant: AdminProductVariant
}

// The widget component
const VariantLocalizationWidget = ({ 
  data,
}: DetailWidgetProps<AdminProductVariant>) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [localizations, setLocalizations] = useState<VariantLocalizationMap>({})
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [hasChanges, setHasChanges] = useState(false)

  // Get initial localization data from metadata
  const getInitialLocalizations = useCallback((): VariantLocalizationMap => {
    if (!data.metadata) return {}
    
    const metadata = data.metadata as Record<string, any>
    const localizationData = metadata.localizations
    
    if (typeof localizationData === 'object' && localizationData !== null) {
      console.log('Found existing variant localization data:', localizationData)
      return localizationData
    }
    
    return {}
  }, [data.metadata])

  // Initialize localizations from metadata
  useEffect(() => {
    const initialLocalizations = getInitialLocalizations()
    setLocalizations(initialLocalizations)
    setHasChanges(false)
  }, [getInitialLocalizations])

  // Update variant using admin API
  const updateVariantMetadata = useCallback(async (variantId: string, metadata: Record<string, any>) => {
    try {
      console.log('Updating variant metadata:', { variantId, metadata })
      
      const response = await fetch(`/admin/products/${data.product_id}/variants/${variantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update failed response:', errorText)
        throw new Error(`Update failed: ${response.status} ${response.statusText}`)
      }

      const result: VariantUpdateResponse = await response.json()
      console.log('Variant updated successfully:', result.variant)
      
      // Update the local data reference to reflect the new metadata
      if (result.variant) {
        Object.assign(data, result.variant)
      }
      
      return result.variant
    } catch (error) {
      console.error('Update error:', error)
      throw error
    }
  }, [data])

  // Show error notification
  const showError = useCallback((message: string) => {
    toast.error("Error", {
      description: message,
      duration: 5000,
    })
  }, [])

  // Show success notification
  const showSuccess = useCallback((message: string) => {
    toast.success("Success", {
      description: message,
      duration: 3000,
    })
  }, [])

  // Add new language
  const handleAddLanguage = () => {
    if (!selectedLanguage) {
      showError('Please select a language')
      return
    }

    if (localizations[selectedLanguage]) {
      showError('This language already exists')
      return
    }

    const newLocalizations = {
      ...localizations,
      [selectedLanguage]: {
        title: '',
        description: '',
        material: '',
        color: '',
        size: '',
        style: '',
        notes: '',
      }
    }

    setLocalizations(newLocalizations)
    setSelectedLanguage('')
    setHasChanges(true)
  }

  // Remove language
  const handleRemoveLanguage = (languageCode: string) => {
    if (!window.confirm(`Are you sure you want to remove the ${getLanguageLabel(languageCode)} translation?`)) {
      return
    }

    const newLocalizations = { ...localizations }
    delete newLocalizations[languageCode]
    
    setLocalizations(newLocalizations)
    setHasChanges(true)
  }

  // Update localization data
  const handleLocalizationChange = (
    languageCode: string, 
    field: keyof VariantLocalizationData, 
    value: string
  ) => {
    const newLocalizations = {
      ...localizations,
      [languageCode]: {
        ...localizations[languageCode],
        [field]: value,
      }
    }

    setLocalizations(newLocalizations)
    setHasChanges(true)
  }

  // Save localizations
  const handleSaveLocalizations = async () => {
    setIsUpdating(true)

    try {
      // Validate that all localizations have at least a title
      const invalidLocalizations = Object.entries(localizations).filter(
        ([_, localization]) => !localization.title.trim()
      )

      if (invalidLocalizations.length > 0) {
        const invalidLanguages = invalidLocalizations.map(([code]) => getLanguageLabel(code)).join(', ')
        showError(`Please provide titles for: ${invalidLanguages}`)
        return
      }

      // Update variant metadata with localizations
      const updatedMetadata = {
        ...(data.metadata || {}),
        localizations: localizations,
        localization_updated_at: new Date().toISOString(),
        available_languages: Object.keys(localizations),
      }
      
      console.log('Saving variant localizations:', updatedMetadata)
      await updateVariantMetadata(data.id, updatedMetadata)

      setHasChanges(false)
      showSuccess('Variant localizations saved successfully')
      
    } catch (error) {
      console.error('Save error:', error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to save localizations. Please try again.'
      showError(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  // Get language label from code
  const getLanguageLabel = (code: string): string => {
    const language = COMMON_LANGUAGES.find(lang => lang.value === code)
    return language ? language.label : code.toUpperCase()
  }

  // Get available languages for selection (excluding already added ones)
  const getAvailableLanguages = () => {
    return COMMON_LANGUAGES.filter(lang => !localizations[lang.value])
  }

  // Check if there are any localizations
  const hasLocalizations = Object.keys(localizations).length > 0

  // Get variant display info
  const getVariantDisplayInfo = () => {
    const options = data.options || []
    const optionValues = options.map(opt => opt.value).join(' / ')
    return {
      title: data.title || optionValues || 'Untitled Variant',
      sku: data.sku || 'No SKU',
      optionValues: optionValues || 'No options'
    }
  }

  const variantInfo = getVariantDisplayInfo()

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-gray-500" />
            <Heading level="h2">Variant Localization</Heading>
            {hasLocalizations && (
              <span className="text-sm text-gray-500">
                ({Object.keys(localizations).length} language{Object.keys(localizations).length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          {hasChanges && (
            <Button
              variant="primary"
              size="small"
              onClick={handleSaveLocalizations}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Variant Info */}
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="text-sm">
            <div className="font-medium text-gray-900">{variantInfo.title}</div>
            <div className="text-gray-600">SKU: {variantInfo.sku}</div>
            {variantInfo.optionValues && (
              <div className="text-gray-600">Options: {variantInfo.optionValues}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 py-4">
        {/* Add language section */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex-1">
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={isUpdating}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select a language to add..." />
                </Select.Trigger>
                <Select.Content>
                  {getAvailableLanguages().map((language) => (
                    <Select.Item key={language.value} value={language.value}>
                      {language.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={handleAddLanguage}
              disabled={!selectedLanguage || isUpdating}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Language
            </Button>
          </div>
        </div>

        {/* Localizations list */}
        {hasLocalizations ? (
          <div className="space-y-6">
            {Object.entries(localizations).map(([languageCode, localization]) => (
              <div key={languageCode} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {languageCode.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">
                      {getLanguageLabel(languageCode)}
                    </h3>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleRemoveLanguage(languageCode)}
                    disabled={isUpdating}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Title input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variant Title *
                    </label>
                    <Input
                      value={localization.title}
                      onChange={(e) => handleLocalizationChange(languageCode, 'title', e.target.value)}
                      placeholder={`Enter variant title in ${getLanguageLabel(languageCode)}`}
                      disabled={isUpdating}
                      className="w-full"
                    />
                  </div>

                  {/* Description input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      value={localization.description || ''}
                      onChange={(e) => handleLocalizationChange(languageCode, 'description', e.target.value)}
                      placeholder={`Enter variant description in ${getLanguageLabel(languageCode)}`}
                      disabled={isUpdating}
                      className="w-full"
                      rows={3}
                    />
                  </div>

                  {/* Additional fields in a grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material
                      </label>
                      <Input
                        value={localization.material || ''}
                        onChange={(e) => handleLocalizationChange(languageCode, 'material', e.target.value)}
                        placeholder="Material name"
                        disabled={isUpdating}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <Input
                        value={localization.color || ''}
                        onChange={(e) => handleLocalizationChange(languageCode, 'color', e.target.value)}
                        placeholder="Color name"
                        disabled={isUpdating}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <Input
                        value={localization.size || ''}
                        onChange={(e) => handleLocalizationChange(languageCode, 'size', e.target.value)}
                        placeholder="Size description"
                        disabled={isUpdating}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Style
                      </label>
                      <Input
                        value={localization.style || ''}
                        onChange={(e) => handleLocalizationChange(languageCode, 'style', e.target.value)}
                        placeholder="Style description"
                        disabled={isUpdating}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <Textarea
                      value={localization.notes || ''}
                      onChange={(e) => handleLocalizationChange(languageCode, 'notes', e.target.value)}
                      placeholder={`Additional notes in ${getLanguageLabel(languageCode)}`}
                      disabled={isUpdating}
                      className="w-full"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Localizations Added
            </h3>
            <p className="text-gray-500 mb-4">
              Add translations for your variant title and attributes in different languages.
            </p>
            <p className="text-sm text-gray-400">
              Select a language from the dropdown above to get started.
            </p>
          </div>
        )}

        {/* Save button at bottom */}
        {hasLocalizations && hasChanges && (
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="primary"
              onClick={handleSaveLocalizations}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving Localizations...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All Localizations
                </>
              )}
            </Button>
          </div>
        )}

        {/* Metadata storage info */}
        {hasLocalizations && (
          <div className="mt-6 p-3 bg-blue-50 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Metadata Storage</p>
                <ul className="space-y-1 text-blue-600">
                  <li>• <code>localizations</code> - Object containing all translations</li>
                  <li>• <code>available_languages</code> - Array of language codes</li>
                  <li>• <code>localization_updated_at</code> - Last update timestamp</li>
                </ul>
                <p className="mt-2 text-blue-600">
                  Each language contains: <code>title</code>, <code>description</code>, <code>material</code>, <code>color</code>, <code>size</code>, <code>style</code>, and <code>notes</code> fields
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current metadata display */}
        {hasLocalizations && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Current Localization Data
              </label>
              <pre className="text-xs text-gray-600 overflow-x-auto p-2 bg-white rounded border max-h-32">
                {JSON.stringify(localizations, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

// Widget configuration
export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
})

export default VariantLocalizationWidget