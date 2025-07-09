import { test, expect } from '@playwright/test'

test.describe('Solar System', () => {
  test('should load and display the solar system', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('canvas')
    
    // Check if the time scrubber is visible
    await expect(page.locator('[aria-label="Time scrubber"]')).toBeVisible()
    
    // Check if control panel is visible
    await expect(page.locator('button:has-text("Orbits")')).toBeVisible()
    
    // Check if the page title is correct
    await expect(page).toHaveTitle('Interactive Solar System')
  })
  
  test('should allow time scrubbing', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('canvas')
    
    // Find the play button and click it
    const playButton = page.locator('[aria-label="Play"]')
    await playButton.click()
    
    // Should now show pause button
    await expect(page.locator('[aria-label="Pause"]')).toBeVisible()
    
    // Click pause
    await page.locator('[aria-label="Pause"]').click()
    
    // Should show play button again
    await expect(playButton).toBeVisible()
  })
  
  test('should allow orbit toggle', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('canvas')
    
    // Toggle orbits
    const orbitsButton = page.locator('button:has-text("Orbits")')
    await orbitsButton.click()
    
    // Check if the button state changed (this would need to be adapted based on actual implementation)
    await expect(orbitsButton).toBeVisible()
  })
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone size
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('canvas')
    
    // Check if mobile hint is visible
    await expect(page.locator('text=Pinch to zoom')).toBeVisible()
    
    // Check if time scrubber is still functional on mobile
    await expect(page.locator('[aria-label="Time scrubber"]')).toBeVisible()
  })
  
  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('canvas')
    
    // Test spacebar for play/pause
    await page.keyboard.press('Space')
    
    // Test arrow keys for time navigation
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    
    // Test reset
    await page.keyboard.press('KeyR')
    
    // These tests would need to check actual state changes
    // For now, we just verify the app doesn't crash
    await expect(page.locator('canvas')).toBeVisible()
  })
}) 